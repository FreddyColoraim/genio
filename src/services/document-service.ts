import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types UI
// ---------------------------------------------------------------------------

export type DocumentStatus = "pending" | "review" | "signed";

export type DocumentListItem = {
  id: string;
  entityId: string;
  employeeId: string;
  entityName: string;
  employeeName: string;
  name: string;
  status: DocumentStatus;
  storagePath: string;
  createdAt: string;
};

export type DocumentEntityOption = { id: string; name: string };
export type DocumentEmployeeOption = DocumentEntityOption;

export type DocumentsData = {
  documents: DocumentListItem[];
  employees: DocumentEntityOption[];
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  pending: "En attente",
  review:  "Reçu",
  signed:  "Validé",
};

const maxUploadSize = 20 * 1024 * 1024;

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
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .single();

  if (memberError || !membership) throw new Error("Aucun tenant associé à votre compte.");

  return { userId: userData.user.id, tenantId: membership.tenant_id as string };
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

export async function getDocumentsData(): Promise<DocumentsData> {
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entityRows, error: entityError } = await admin
    .from("entities")
    .select("id, first_name, last_name")
    .eq("tenant_id", tenantId)
    .in("entity_type", ["employee", "candidate"])
    .eq("status", "active")
    .order("last_name", { ascending: true });

  if (entityError) throw new Error(`Impossible de charger les entités : ${entityError.message}`);

  const entityMap = Object.fromEntries(
    (entityRows ?? []).map((e) => [
      e.id,
      [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
    ])
  );

  const entityIds = Object.keys(entityMap);

  const { data: docRows, error: docsError } = await admin
    .from("documents")
    .select("id, entity_id, name, signature_status, file_path, created_at")
    .eq("tenant_id", tenantId)
    .in("entity_id", entityIds)
    .order("created_at", { ascending: false });

  if (docsError) throw new Error(`Impossible de charger les documents : ${docsError.message}`);

  return {
    employees: (entityRows ?? []).map((e) => ({
      id:   e.id,
      name: entityMap[e.id] ?? "—",
    })),
    documents: (docRows ?? []).map((d) => ({
      id:           d.id,
      entityId:     d.entity_id ?? "",
      employeeId:   d.entity_id ?? "",
      entityName:   entityMap[d.entity_id ?? ""] ?? "Collaborateur supprimé",
      employeeName: entityMap[d.entity_id ?? ""] ?? "Collaborateur supprimé",
      name:         d.name,
      status:       (d.signature_status === "signed" ? "signed" : "pending") as DocumentStatus,
      storagePath:  d.file_path,
      createdAt:    d.created_at,
    })),
  };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function createEntityDocument(formData: FormData) {
  const entityId = z.string().uuid().parse(formData.get("employeeId"));
  const name     = z.string().trim().min(2).parse(formData.get("name"));
  const file     = formData.get("file");

  if (!(file instanceof File) || file.size === 0) throw new Error("Un fichier est requis.");
  if (file.size > maxUploadSize) throw new Error("Le fichier ne doit pas dépasser 20 Mo.");

  const { userId, tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { data: entity, error: entityError } = await admin
    .from("entities")
    .select("id, tenant_id")
    .eq("id", entityId)
    .single();

  if (entityError) throw new Error(`Entité introuvable : ${entityError.message}`);
  if (entity.tenant_id !== tenantId) throw new Error("Cette entité n'appartient pas à votre organisation.");

  const ext         = file.name.split(".").pop() ?? "bin";
  const storagePath = `${tenantId}/${entityId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("documents")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      ...(file.type ? { contentType: file.type } : {}),
    });

  if (uploadError) throw new Error(`Impossible d'uploader le document : ${uploadError.message}`);

  const { error: insertError } = await admin.from("documents").insert({
    tenant_id:        tenantId,
    entity_id:        entityId,
    doc_type:         "contract",
    name,
    file_path:        storagePath,
    file_size_kb:     Math.round(file.size / 1024),
    mime_type:        file.type || null,
    signature_status: "pending",
    uploaded_by:      userId,
  });

  if (insertError) {
    await admin.storage.from("documents").remove([storagePath]);
    throw new Error(`Impossible de créer le document : ${insertError.message}`);
  }
}

// ---------------------------------------------------------------------------
// Mise à jour statut
// ---------------------------------------------------------------------------

export async function updateDocumentStatus(formData: FormData) {
  const documentId = z.string().uuid().parse(formData.get("documentId"));
  const status     = z.enum(["pending", "signed"]).parse(formData.get("status"));
  const { tenantId } = await getTenantContext();
  const admin = createAdminClient();

  const { error } = await admin
    .from("documents")
    .update({
      signature_status: status,
      ...(status === "signed" ? { signed_at: new Date().toISOString() } : {}),
    })
    .eq("id", documentId)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(`Impossible de mettre à jour le document : ${error.message}`);
}

// ---------------------------------------------------------------------------
// Aliases de compatibilité (anciens noms utilisés par les pages existantes)
// ---------------------------------------------------------------------------

export const createEmployeeDocument       = createEntityDocument;
export const updateEmployeeDocumentStatus = updateDocumentStatus;
