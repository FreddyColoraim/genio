import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Vercel Cron — déclenché chaque jour à 8h UTC
// Traite les reminders dus, les marque comme envoyés.
//
// Pour brancher un vrai provider email (Resend, Postmark…) :
// remplacer le console.log par votre appel API d'envoi.
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // Vérification sécurité : Vercel envoie un header Authorization en production
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const now   = new Date();

    // Reminders dus et non encore envoyés
    const { data: dueReminders, error } = await admin
      .from("reminders")
      .select("id, tenant_id, entity_id, title, body, channel, due_at")
      .eq("status", "pending")
      .lte("due_at", now.toISOString())
      .limit(50);

    if (error) throw new Error(error.message);
    if (!dueReminders?.length) {
      return Response.json({ processed: 0, message: "Aucun reminder dû." });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const reminder of dueReminders) {
      try {
        // ── Envoi email / push ──
        // TODO: brancher Resend / Postmark / SendGrid ici
        // await sendEmail({ to: reminder.entity_email, subject: reminder.title, body: reminder.body })
        console.log(`[CRON] Reminder envoyé : ${reminder.title} (id=${reminder.id}, channel=${reminder.channel})`);

        // Marquer comme envoyé
        await admin
          .from("reminders")
          .update({
            status:   "sent",
            sent_at:  now.toISOString(),
          })
          .eq("id", reminder.id);

        processed++;
      } catch (err) {
        errors.push(`${reminder.id}: ${err instanceof Error ? err.message : "Erreur"}`);
      }
    }

    // Marquer comme "overdue" les reminders très en retard (> 7 jours)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    await admin
      .from("reminders")
      .update({ status: "overdue" })
      .eq("status", "pending")
      .lte("due_at", sevenDaysAgo);

    return Response.json({
      processed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("[CRON] Erreur reminders:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
