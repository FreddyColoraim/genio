"use server";

import { revalidatePath } from "next/cache";
import { saveDocKit } from "@/services/onboarding-docs-service";
import type { DocBloc, DocAction } from "@/lib/onboarding-docs-catalog";

export type SaveDocKitResult =
  | { success: true }
  | { success: false; error: string };

export async function saveDocKitAction(
  entityId: string,
  docs: {
    docId:         string;
    label:         string;
    bloc:          DocBloc;
    action:        DocAction;
    customization: Record<string, string>;
  }[]
): Promise<SaveDocKitResult> {
  try {
    await saveDocKit({ entityId, docs });
    revalidatePath(`/employees/${entityId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
