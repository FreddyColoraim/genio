import { getDocumentsData } from "@/services/document-service";
import { getTeamMembers } from "@/services/team-service";

function escapeCsv(v: unknown): string {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  try {
    const [{ documents }, members] = await Promise.all([
      getDocumentsData(),
      getTeamMembers(),
    ]);

    const today = new Date().toISOString().slice(0, 10);

    // Section 1 — Documents uploadés
    const docHeaders = ["Type", "Nom", "Collaborateur", "Statut", "Date dépôt"];
    const docRows = documents.map((d) => [
      "Uploadé",
      d.name,
      d.entityName,
      d.status === "signed" ? "Validé" : d.status === "review" ? "Reçu" : "En attente",
      new Date(d.createdAt).toLocaleDateString("fr-FR"),
    ]);

    // Section 2 — Kit docs (collect) depuis l'équipe
    const kitRows: string[][] = [];
    for (const m of members) {
      if (m.pendingDocuments > 0) {
        kitRows.push([
          "Kit — À collecter",
          `${m.pendingDocuments} document(s) manquant(s)`,
          m.name,
          "En attente",
          "",
        ]);
      }
    }

    const allRows = [docHeaders, ...docRows, [], docHeaders, ...kitRows];
    const csv = allRows
      .map((row) => (row.length === 0 ? "" : row.map(escapeCsv).join(",")))
      .join("\r\n");

    return new Response("﻿" + csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="documents-${today}.csv"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
