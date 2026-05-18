"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeOnboardingStep } from "@/services/employee-service";

export async function completeOnboardingStepAction(formData: FormData) {
  try {
    await completeOnboardingStep(formData);
  } catch (error) {
    console.error(error);
    redirect("/dashboard?error=onboarding_step_failed");
  }

  revalidatePath("/dashboard");
  revalidatePath("/employees");
  redirect("/dashboard?updated=onboarding");
}
