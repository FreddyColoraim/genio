import { getTeamMembers } from "@/services/team-service";

const STATUS_LABELS = {
  not_started: "Non démarré",
  in_progress:  "En cours",
  complete:     "Terminé",
} as const;

function escapeCsv(v: unknown): string {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET() {
  try {
    const members = await getTeamMembers();

    const headers = [
      "Nom", "Email", "Poste", "Département", "Manager",
      "Date d'arrivée", "Statut", "Progression (%)",
      "Tâches complètes", "Tâches totales", "Docs en attente", "Alertes",
    ];

    const today = new Date().toISOString().slice(0, 10);

    const rows = members.map((m) => [
      m.name,
      m.email,
      m.poste,
      m.department,
      m.manager,
      m.startDate
        ? new Date(m.startDate).toLocaleDateString("fr-FR")
        : "",
      STATUS_LABELS[m.status],
      m.progress,
      m.completedTasks,
      m.totalTasks,
      m.pendingDocuments,
      m.alerts.map((a) => a.label).join(" | "),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    return new Response("﻿" + csv, {   // BOM for Excel UTF-8
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="equipe-${today}.csv"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
