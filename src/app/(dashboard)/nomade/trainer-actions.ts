"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createTrainer,
  updateTrainer,
  deactivateTrainer,
  assignTrainerToSession,
  removeTrainerFromSession,
} from "@/services/trainer-service";
import { brevoSendTemplate, BREVO_TEMPLATES } from "@/lib/brevo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Créer un formateur
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name:        z.string().trim().min(1, "Nom requis"),
  email:       z.string().trim().email("Email invalide"),
  phone:       z.string().trim().default(""),
  bio:         z.string().trim().default(""),
  competences: z.string().trim().default(""),  // CSV
  specialties: z.string().trim().default(""),  // CSV
});

export type CreateTrainerResult =
  | { success: true; id: string; token: string }
  | { success: false; error: string };

export async function createTrainerAction(formData: FormData): Promise<CreateTrainerResult> {
  try {
    const input = createSchema.parse(Object.fromEntries(formData));

    const competences = input.competences
      .split(",").map((s) => s.trim()).filter(Boolean);
    const specialties = input.specialties
      .split(",").map((s) => s.trim()).filter(Boolean);

    const trainerInput: Parameters<typeof createTrainer>[0] = {
      name:  input.name,
      email: input.email,
      competences,
      specialties,
    };
    if (input.phone) trainerInput.phone = input.phone;
    if (input.bio)   trainerInput.bio   = input.bio;

    const { id, accessToken } = await createTrainer(trainerInput);

    // Envoyer le lien portail au formateur
    await brevoSendTemplate({
      templateId: BREVO_TEMPLATES.welcome,
      to: [{ email: input.email, name: input.name }],
      params: {
        PRENOM: input.name.split(" ")[0] ?? input.name,
        LIEN:   `${APP_URL}/formateur/${accessToken}`,
      },
    }).catch(() => null); // non bloquant

    revalidatePath("/nomade");
    return { success: true, id, token: accessToken };
  } catch (err) {
    if (err instanceof z.ZodError) return { success: false, error: err.errors[0]?.message ?? "Champs invalides." };
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Mettre à jour un formateur
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  id:          z.string().uuid(),
  name:        z.string().trim().optional(),
  phone:       z.string().trim().optional(),
  bio:         z.string().trim().optional(),
  competences: z.string().trim().optional(),
  specialties: z.string().trim().optional(),
});

export type UpdateResult = { success: true } | { success: false; error: string };

export async function updateTrainerAction(formData: FormData): Promise<UpdateResult> {
  try {
    const input = updateSchema.parse(Object.fromEntries(formData));
    const patch: Parameters<typeof updateTrainer>[1] = {};
    if (input.name)        patch.name        = input.name;
    if (input.phone)       patch.phone       = input.phone;
    if (input.bio)         patch.bio         = input.bio;
    if (input.competences) patch.competences = input.competences.split(",").map((s) => s.trim()).filter(Boolean);
    if (input.specialties) patch.specialties = input.specialties.split(",").map((s) => s.trim()).filter(Boolean);

    await updateTrainer(input.id, patch);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Désactiver un formateur
// ---------------------------------------------------------------------------

export async function deactivateTrainerAction(trainerId: string): Promise<UpdateResult> {
  try {
    await deactivateTrainer(trainerId);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Assigner / retirer un formateur d'une session
// ---------------------------------------------------------------------------

export async function assignTrainerAction(
  trainerId: string,
  sessionId: string,
  isLead    = true,
): Promise<UpdateResult> {
  try {
    await assignTrainerToSession(trainerId, sessionId, isLead);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

export async function removeTrainerAction(
  trainerId: string,
  sessionId: string,
): Promise<UpdateResult> {
  try {
    await removeTrainerFromSession(trainerId, sessionId);
    revalidatePath("/nomade");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}

// ---------------------------------------------------------------------------
// Renvoyer le lien portail par email
// ---------------------------------------------------------------------------

export async function resendPortalLinkAction(
  trainerEmail: string,
  trainerName:  string,
  accessToken:  string,
): Promise<UpdateResult> {
  try {
    await brevoSendTemplate({
      templateId: BREVO_TEMPLATES.welcome,
      to: [{ email: trainerEmail, name: trainerName }],
      params: {
        PRENOM: trainerName.split(" ")[0] ?? trainerName,
        LIEN:   `${APP_URL}/formateur/${accessToken}`,
      },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue." };
  }
}
