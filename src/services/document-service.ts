import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DocumentStatus = "pending" | "review" | "signed";

export type DocumentListItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  status: DocumentStatus;
  storagePath: string;
  createdAt: string;
};

export type DocumentEmployeeOption = {
  id: string;
  name: string;
};

export type DocumentsData = {
  documents: DocumentListItem[];
  employees: DocumentEmployeeOption[];
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  pending: "En attente",
  review: "Reçu",
  signed: "Validé"
};

const documentStatusSchema = z.enum(["pending", "review", "signed"]);
const maxUploadSize = 20 * 1024 * 1024;

type ProfileRow = {
  id: string;
  workspace_id: string | null;
};

type EmployeeRow = {
  id: string;
  full_name: string;
  workspace_id: string;
};

type DocumentRow = {
  id: string;
  employee_id: string;
  name: string;
  status: DocumentStatus;
  storage_path: string;
  created_at: string;
  employees: { full_name: string } | { full_name: string }[] | null;
};

export async function getDocumentsData(): Promise<DocumentsData> {
  const supabase = await createClient();

  const { data: employeeRows, error: employeesError } = await supabase
    .from("employees")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  if (employeesError) {
    throw new Error(`Unable to load document employees: ${employeesError.message}`);
  }

  const { data: documentRows, error: documentsError } = await supabase
    .from("employee_documents")
    .select("id, employee_id, name, status, storage_path, created_at, employees(full_name)")
    .order("created_at", { ascending: false });

  if (documentsError) {
    throw new Error(`Unable to load documents: ${documentsError.message}`);
  }

  return {
    employees: ((employeeRows ?? []) as Pick<EmployeeRow, "id" | "full_name">[]).map(
      (employee) => ({
        id: employee.id,
        name: employee.full_name
      })
    ),
    documents: ((documentRows ?? []) as unknown as DocumentRow[]).map((document) => ({
      id: document.id,
      employeeId: document.employee_id,
      employeeName: getDocumentEmployeeName(document.employees),
      name: document.name,
      status: document.status,
      storagePath: document.storage_path,
      createdAt: document.created_at
    }))
  };
}

function getDocumentEmployeeName(employee: DocumentRow["employees"]) {
  if (Array.isArray(employee)) {
    return employee[0]?.full_name ?? "Collaborateur supprimé";
  }

  return employee?.full_name ?? "Collaborateur supprimé";
}

export async function createEmployeeDocument(formData: FormData) {
  const employeeId = z.string().uuid().parse(formData.get("employeeId"));
  const name = z.string().trim().min(2).parse(formData.get("name"));
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Un fichier est requis.");
  }

  if (file.size > maxUploadSize) {
    throw new Error("Le fichier ne doit pas dépasser 20 Mo.");
  }

  const { userId, workspaceId } = await getCurrentProfile();
  const adminClient = createAdminClient();
  const { data: employee, error: employeeError } = await adminClient
    .from("employees")
    .select("id, workspace_id, full_name")
    .eq("id", employeeId)
    .single();

  if (employeeError) {
    throw new Error(`Impossible de charger le collaborateur: ${employeeError.message}`);
  }

  const typedEmployee = employee as EmployeeRow;

  if (typedEmployee.workspace_id !== workspaceId) {
    throw new Error("Ce collaborateur n'appartient pas à votre workspace.");
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const storagePath = `${workspaceId}/${employeeId}/${crypto.randomUUID()}.${extension}`;
  const uploadOptions = {
    cacheControl: "3600",
    upsert: false,
    ...(file.type ? { contentType: file.type } : {})
  };

  const { error: uploadError } = await adminClient.storage
    .from("employee-documents")
    .upload(storagePath, file, uploadOptions);

  if (uploadError) {
    throw new Error(`Impossible d'uploader le document: ${uploadError.message}`);
  }

  const { error: insertError } = await adminClient.from("employee_documents").insert({
    employee_id: employeeId,
    workspace_id: workspaceId,
    name,
    storage_path: storagePath,
    status: "pending",
    uploaded_by: userId
  });

  if (insertError) {
    await adminClient.storage.from("employee-documents").remove([storagePath]);
    throw new Error(`Impossible de créer le document: ${insertError.message}`);
  }
}

export async function updateEmployeeDocumentStatus(formData: FormData) {
  const documentId = z.string().uuid().parse(formData.get("documentId"));
  const status = documentStatusSchema.parse(formData.get("status"));
  const { workspaceId } = await getCurrentProfile();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("employee_documents")
    .update({ status })
    .eq("id", documentId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(`Impossible de mettre à jour le document: ${error.message}`);
  }
}

async function getCurrentProfile() {
  const sessionClient = await createClient();
  const { data: userData, error: userError } = await sessionClient.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Vous devez être connecté pour gérer les documents.");
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, workspace_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(`Impossible de charger le profil utilisateur: ${profileError.message}`);
  }

  const typedProfile = profile as ProfileRow;

  if (!typedProfile.workspace_id) {
    throw new Error("Aucun workspace n'est associé à votre profil.");
  }

  return {
    userId: typedProfile.id,
    workspaceId: typedProfile.workspace_id
  };
}
