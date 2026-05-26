import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Tests de la logique CSV (sans appel réseau)
// ---------------------------------------------------------------------------

function buildCsv(headers: string[], rows: unknown[][]): string {
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}

describe("buildCsv", () => {
  it("génère un CSV valide", () => {
    const csv = buildCsv(["Nom", "Email"], [["Alice", "alice@test.com"]]);
    expect(csv).toContain('"Nom","Email"');
    expect(csv).toContain('"Alice","alice@test.com"');
  });

  it("utilise \\r\\n comme séparateur de lignes", () => {
    const csv = buildCsv(["A", "B"], [["1", "2"], ["3", "4"]]);
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("échappe les guillemets dans les valeurs", () => {
    const csv = buildCsv(["Texte"], [['Il dit "bonjour"']]);
    expect(csv).toContain('"Il dit ""bonjour"""');
  });

  it("gère les valeurs vides", () => {
    const csv = buildCsv(["A", "B"], [["", null]]);
    expect(csv).toContain('"",""');
  });
});

// ── Format status labels ──
describe("status labels", () => {
  const STATUS_LABELS = {
    not_started: "Non démarré",
    in_progress:  "En cours",
    complete:     "Terminé",
  } as const;

  it("retourne le label correct pour chaque statut", () => {
    expect(STATUS_LABELS["not_started"]).toBe("Non démarré");
    expect(STATUS_LABELS["in_progress"]).toBe("En cours");
    expect(STATUS_LABELS["complete"]).toBe("Terminé");
  });
});
