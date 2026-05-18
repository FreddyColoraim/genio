"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEmployeeDocument,
  updateEmployeeDocumentStatus
} from "@/services/document-service";

export async function createDocumentAction(formData: FormData) {
  try {
    await createEmployeeDocument(formData);
  } catch (error) {
    console.error(error);
    redirect("/documents?error=document_create_failed");
  }

  revalidatePath("/dashboard");
  revalidatePath("/documents");
  redirect("/documents?created=1");
}

export async function updateDocumentStatusAction(formData: FormData) {
  try {
    await updateEmployeeDocumentStatus(formData);
  } catch (error) {
    console.error(error);
    redirect("/documents?error=document_status_failed");
  }

  revalidatePath("/dashboard");
  revalidatePath("/documents");
  redirect("/documents?updated=1");
}
