"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  briefId: string;
  briefTitle: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const empty: FormState = { firstName: "", lastName: "", email: "", phone: "", message: "" };

export function CandidatureForm({ briefId, briefTitle }: Props) {
  const [form, setForm]       = useState<FormState>(empty);
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg]   = useState<string | null>(null);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg(null);

    try {
      const res = await fetch(`/api/candidature/${briefId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrMsg(data.error ?? "Une erreur est survenue.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrMsg("Erreur réseau. Vérifiez votre connexion.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">Candidature envoyée !</p>
          <p className="mt-1 text-sm text-slate-500">
            Votre profil a bien été transmis pour le poste :{" "}
            <span className="font-medium text-slate-700">{briefTitle}</span>
          </p>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          L'équipe RH prendra contact avec vous prochainement.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom <span className="text-red-500">*</span></Label>
          <Input
            id="firstName"
            required
            autoComplete="given-name"
            inputMode="text"
            placeholder="Jean"
            value={form.firstName}
            onChange={set("firstName")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom <span className="text-red-500">*</span></Label>
          <Input
            id="lastName"
            required
            autoComplete="family-name"
            inputMode="text"
            placeholder="Dupont"
            value={form.lastName}
            onChange={set("lastName")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          required
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="jean.dupont@email.com"
          value={form.email}
          onChange={set("email")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="06 00 00 00 00"
          value={form.phone}
          onChange={set("phone")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message de motivation</Label>
        <textarea
          id="message"
          rows={4}
          placeholder="Décrivez brièvement votre motivation ou votre parcours…"
          value={form.message}
          onChange={set("message")}
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {status === "error" && errMsg && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errMsg}
        </p>
      )}

      <Button
        className="w-full"
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {status === "loading" ? "Envoi en cours…" : "Envoyer ma candidature"}
      </Button>
    </form>
  );
}
