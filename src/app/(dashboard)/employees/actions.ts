"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCandidate } from "@/services/entity-service";

export async function createEmployeeAction(formData: FormData) {
  try {
    await createCandidate(formData);
  } catch (error) {
    console.error(error);
    redirect("/employees?error=employee_create_failed");
  }

  revalidatePath("/dashboard");
  revalidatePath("/employees");
  redirect("/employees?created=1");
}
