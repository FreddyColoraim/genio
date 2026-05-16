import { createClient } from "@/lib/supabase/client";

export type DocumentUploadResult = {
  path: string;
  fullPath: string;
};

export async function uploadEmployeeDocument(
  file: File,
  employeeId: string
): Promise<DocumentUploadResult> {
  const supabase = createClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${employeeId}/${crypto.randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from("employee-documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw error;
  }

  return {
    path: data.path,
    fullPath: data.fullPath
  };
}
