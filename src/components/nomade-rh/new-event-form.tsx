"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";

export function NewEventForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [active, setActive] = useState<string | null>(null);

  function handleSave() {
    if (!name.trim()) return;
    // Persist event name in localStorage so capture form can pick it up
    try {
      const stored = JSON.parse(localStorage.getItem("nomade_events") ?? "[]") as string[];
      if (!stored.includes(name.trim())) stored.push(name.trim());
      localStorage.setItem("nomade_events", JSON.stringify(stored));
      localStorage.setItem("nomade_active_event", name.trim());
    } catch {
      // localStorage not available
    }
    setActive(name.trim());
    setName("");
    setOpen(false);
  }

  if (active) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between mb-0">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">Événement actif : {active}</span>
        </div>
        <button
          onClick={() => {
            setActive(null);
            try { localStorage.removeItem("nomade_active_event"); } catch { /* noop */ }
          }}
          className="text-emerald-500 hover:text-emerald-700"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl bg-white shadow-sm px-4 py-3 text-sm font-semibold text-[#1B2A4A] w-full border border-dashed border-[#1B2A4A]/20"
      >
        <Plus className="size-4" /> Nouvel événement actif
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3">
      <p className="text-sm font-bold text-[#1B2A4A]">Nommer l&apos;événement</p>
      <input
        autoFocus
        type="text"
        placeholder="Ex: Forum Emploi Paris 2024"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 rounded-xl bg-[#1B2A4A] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Activer
        </button>
      </div>
    </div>
  );
}
