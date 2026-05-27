"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeOnboardingTask } from "@/services/entity-service";

export async function completeOnboardingStepAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "").trim() || "/dashboard";

  try {
    await completeOnboardingTask(formData);
  } catch (error) {
    console.error(error);
    redirect("/dashboard?error=onboarding_step_failed");
  }

  revalidatePath("/dashboard");
  revalidatePath("/employees");
  revalidatePath(returnTo);
  redirect(returnTo as never);
}
