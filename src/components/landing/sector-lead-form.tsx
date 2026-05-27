"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  sectorId:  string;
  ctaLabel?: string;
  className?: string;
};

export function SectorLeadForm({ sectorId, ctaLabel = "Commencer l'essai gratuit", className }: Props) {
  const [email,     setEmail]     = useState("");
  const [firstName, setFirstName] = useState("");
  const [company,   setCompany]   = useState("");
  const [status,    setStatus]    = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/marketing/lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, firstName, company, sector: sectorId }),
      });

      if (res.ok) {
        setStatus("success");
        // Redirect to signup after 1.5s
        setTimeout(() => {
          window.location.href = `/signup?profile=${sectorId}&email=${encodeURIComponent(email)}`;
        }, 1500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 ${className ?? ""}`}>
        <CheckCircle2 className="size-5 shrink-0" />
        <p className="text-sm font-medium">Super ! Redirection vers votre espace en cours…</p>
      </div>
    );
  }

  return (
    <form className={`space-y-3 ${className ?? ""}`} onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 block text-xs font-medium" htmlFor="lf-firstname">
            Prénom
          </Label>
          <Input
            id="lf-firstname"
            placeholder="Marie"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium" htmlFor="lf-company">
            Entreprise / Structure
          </Label>
          <Input
            id="lf-company"
            placeholder="Mon organisation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block text-xs font-medium" htmlFor="lf-email">
          Email professionnel <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lf-email"
          required
          type="email"
          placeholder="marie@monentreprise.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-600">Une erreur est survenue. Réessayez ou écrivez-nous.</p>
      )}

      <Button
        className="group w-full"
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading" ? "Envoi…" : ctaLabel}
        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </Button>
      <p className="text-center text-[11px] text-slate-400">
        Sans carte bancaire · 14 jours d'essai gratuit · Résiliable à tout moment
      </p>
    </form>
  );
}
