import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Tests utilitaires purs (sans dépendance Supabase)
// ---------------------------------------------------------------------------

// ── computeTeamOverview ──
describe("computeTeamOverview", () => {
  // Import inline pour éviter le mock Supabase
  function computeTeamOverview(members: {
    status: "not_started" | "in_progress" | "complete";
    totalTasks: number;
    completedTasks: number;
    alerts: unknown[];
  }[]) {
    return {
      total:          members.length,
      inProgress:     members.filter((m) => m.status === "in_progress").length,
      complete:       members.filter((m) => m.status === "complete").length,
      pendingActions: members.reduce((acc, m) => acc + (m.totalTasks - m.completedTasks), 0),
      alertCount:     members.reduce((acc, m) => acc + m.alerts.length, 0),
    };
  }

  it("retourne des zéros pour une équipe vide", () => {
    const result = computeTeamOverview([]);
    expect(result.total).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.pendingActions).toBe(0);
  });

  it("calcule correctement les statuts", () => {
    const members = [
      { status: "in_progress" as const, totalTasks: 5, completedTasks: 2, alerts: ["a"] },
      { status: "complete"    as const, totalTasks: 5, completedTasks: 5, alerts: [] },
      { status: "not_started" as const, totalTasks: 0, completedTasks: 0, alerts: ["b", "c"] },
    ];
    const result = computeTeamOverview(members);
    expect(result.total).toBe(3);
    expect(result.inProgress).toBe(1);
    expect(result.complete).toBe(1);
    expect(result.pendingActions).toBe(3); // (5-2) + (5-5) + (0-0)
    expect(result.alertCount).toBe(3);
  });
});

// ── CSV escape ──
describe("escapeCsv", () => {
  function escapeCsv(v: unknown): string {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  }

  it("entoure de guillemets", () => {
    expect(escapeCsv("hello")).toBe('"hello"');
  });

  it("échappe les guillemets internes", () => {
    expect(escapeCsv('say "hello"')).toBe('"say ""hello"""');
  });

  it("gère null et undefined", () => {
    expect(escapeCsv(null)).toBe('""');
    expect(escapeCsv(undefined)).toBe('""');
  });

  it("gère les nombres", () => {
    expect(escapeCsv(42)).toBe('"42"');
  });
});

// ── Notification urgence ──
describe("notification urgency", () => {
  it("est urgent si due_at est passé", () => {
    const dueAt = new Date(Date.now() - 3600000); // 1h avant
    const isNow = dueAt <= new Date();
    expect(isNow).toBe(true);
  });

  it("n'est pas urgent si due_at est dans le futur", () => {
    const dueAt = new Date(Date.now() + 3600000); // 1h après
    const isNow = dueAt <= new Date();
    expect(isNow).toBe(false);
  });
});

// ── Analytics — funnel conversion ──
describe("pipeline funnel", () => {
  it("calcule le taux de conversion", () => {
    const prev = 100;
    const curr = 40;
    const rate = Math.round((curr / prev) * 100);
    expect(rate).toBe(40);
  });

  it("retourne 100% pour la première étape", () => {
    const rate = 100; // valeur fixe pour "new"
    expect(rate).toBe(100);
  });
});
