import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, VoiceActionItem } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Helpers session
// ---------------------------------------------------------------------------

async function getTenantContext() {
  const sessionClient = await createClient();
  const { data: userData, error } = await sessionClient.auth.getUser();
  if (error || !userData.user) throw new Error("Vous devez être connecté.");

  const admin = createAdminClient();
  const { data: membership, error: memberError } = await admin
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) throw new Error("Aucun tenant associé à votre compte.");

  return {
    userId: userData.user.id,
    tenantId: membership.tenant_id as string,
    role: membership.role as string,
  };
}

// ---------------------------------------------------------------------------
// Upload audio to Supabase Storage
// ---------------------------------------------------------------------------

export async function uploadVoiceAudio(formData: FormData): Promise<{
  audioUrl: string;
  storagePath: string;
  noteId: string;
}> {
  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier audio requis.");
  if (file.size > 25 * 1024 * 1024) throw new Error("La note vocale ne doit pas dépasser 25 Mo.");

  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const ext = file.name.split(".").pop() ?? "webm";
  const storagePath = `${tenantId}/${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("voice-notes")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "audio/webm",
    });

  if (uploadError) throw new Error(`Impossible d'uploader la note : ${uploadError.message}`);

  const { data: { publicUrl: audioUrl } } = admin.storage
    .from("voice-notes")
    .getPublicUrl(storagePath);

  // Insert voice_note record with status "processing"
  const { data: note, error: insertError } = await admin
    .from("voice_notes")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      audio_url: audioUrl,
      status: "processing" as const,
      recorded_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    await admin.storage.from("voice-notes").remove([storagePath]);
    throw new Error(`Impossible de créer la note : ${insertError.message}`);
  }

  return { audioUrl, storagePath, noteId: note.id };
}

// ---------------------------------------------------------------------------
// Transcribe with Whisper (OpenAI)
// ---------------------------------------------------------------------------

async function transcribeAudio(audioUrl: string, storagePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY manquant — transcription impossible.");

  const openai = new OpenAI({ apiKey });

  // Fetch the audio file from storage
  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error("Impossible de récupérer le fichier audio.");

  const audioBuffer = await response.arrayBuffer();
  const ext = storagePath.split(".").pop() ?? "webm";
  const audioFile = new File([audioBuffer], `voice.${ext}`, { type: response.headers.get("content-type") || "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "fr",
    response_format: "text",
  });

  return typeof transcription === "string" ? transcription : (transcription as { text: string }).text;
}

// ---------------------------------------------------------------------------
// Process with Claude API → extract actions
// ---------------------------------------------------------------------------

async function extractActionsWithClaude(transcript: string): Promise<{
  summary: string;
  actionItems: VoiceActionItem[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquant — traitement IA impossible.");

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `Tu es l'assistant IA de GeniO, une plateforme RH multi-tenant.
Tu analyses des notes vocales prises par des managers ou RH et tu en extrais :
1. Un résumé concis (2-3 phrases maximum)
2. Les actions concrètes à effectuer (tâches, briefs de recrutement, rappels, notes)

Types d'actions disponibles :
- "task" : une tâche à accomplir (ex: "Envoyer le contrat à Maya")
- "brief" : un brief de recrutement à créer (ex: "Recruter un développeur frontend")
- "reminder" : un rappel à programmer (ex: "Rappeler l'entretien de demain")
- "note" : une note informative sans action requise (ex: "Mémoriser que le client préfère les réunions le matin")

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans explications.`;

  const userPrompt = `Voici la transcription d'une note vocale :\n\n"${transcript}"\n\nExtrait le résumé et les actions.`;

  const stream = await anthropic.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();

  // Extract text content from response
  const textContent = message.content.find(
    (c): c is Anthropic.TextBlock => c.type === "text"
  );
  if (!textContent) throw new Error("Réponse Claude invalide.");

  let parsed: { summary: string; actions: VoiceActionItem[] };
  try {
    // Remove potential markdown code fences
    const raw = textContent.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: return a single "note" action with the full transcript
    return {
      summary: transcript.slice(0, 200),
      actionItems: [{ type: "note", title: "Note vocale", body: transcript }],
    };
  }

  return {
    summary: parsed.summary ?? "",
    actionItems: Array.isArray(parsed.actions) ? parsed.actions : [],
  };
}

// ---------------------------------------------------------------------------
// Full pipeline: transcribe + process + save
// ---------------------------------------------------------------------------

export async function processVoiceNote(noteId: string, audioUrl: string, storagePath: string): Promise<{
  transcript: string;
  summary: string;
  actionItems: VoiceActionItem[];
}> {
  const admin = createAdminClient();

  try {
    // 1. Transcribe
    const transcript = await transcribeAudio(audioUrl, storagePath);

    // Update with transcript
    await admin
      .from("voice_notes")
      .update({ transcript, status: "transcribed" as const })
      .eq("id", noteId);

    // 2. Extract actions with Claude
    const { summary, actionItems } = await extractActionsWithClaude(transcript);

    // 3. Save structured result
    await admin
      .from("voice_notes")
      .update({
        ai_summary: summary,
        ai_action_items: actionItems as unknown as Json,
        status: "structured" as const,
      })
      .eq("id", noteId);

    return { transcript, summary, actionItems };
  } catch (err) {
    await admin
      .from("voice_notes")
      .update({ status: "failed" as const })
      .eq("id", noteId);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Confirm action → create task / brief / reminder
// ---------------------------------------------------------------------------

export async function confirmVoiceAction(
  noteId: string,
  action: VoiceActionItem
): Promise<{ type: string; id: string }> {
  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  switch (action.type) {
    case "task": {
      // onboarding_tasks requires an onboarding_id — look it up from entity if provided
      if (action.entity_id) {
        const { data: onboarding } = await admin
          .from("onboardings")
          .select("id")
          .eq("entity_id", action.entity_id)
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (onboarding) {
          const { data, error } = await admin
            .from("onboarding_tasks")
            .insert({
              tenant_id: tenantId,
              onboarding_id: onboarding.id,
              title: action.title,
              description: action.body ?? null,
              priority: 0,
              due_date: action.due_date ?? null,
            })
            .select("id")
            .single();

          if (error) throw new Error(`Impossible de créer la tâche : ${error.message}`);
          await admin.from("voice_notes").update({ created_task_id: data.id }).eq("id", noteId);
          return { type: "task", id: data.id };
        }
      }
      // No entity/onboarding context: save as reminder instead
      const { data, error } = await admin
        .from("reminders")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          title: action.title,
          body: action.body ?? null,
          remind_at: action.due_date ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          entity_id: action.entity_id ?? null,
          channel: "push" as const,
          status: "pending" as const,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Impossible de créer le rappel : ${error.message}`);
      return { type: "task", id: data.id };
    }

    case "reminder": {
      const { data, error } = await admin
        .from("reminders")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          title: action.title,
          body: action.body ?? null,
          remind_at: action.due_date ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          entity_id: action.entity_id ?? null,
          channel: "push" as const,
          status: "pending" as const,
        })
        .select("id")
        .single();

      if (error) throw new Error(`Impossible de créer le rappel : ${error.message}`);

      return { type: "reminder", id: data.id };
    }

    case "brief":
    case "note":
    default: {
      // For briefs and notes, just return confirmation without DB insert
      // (brief creation requires a full form — we note the intent)
      return { type: action.type, id: noteId };
    }
  }
}
