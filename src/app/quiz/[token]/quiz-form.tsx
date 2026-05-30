"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Loader2, Send, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Question } from "@/services/questionnaire-service";

type Props = {
  questionnaireId: string;
  tenantId:        string;
  questions:       Question[];
  storageKey:      string;
  prefillName?:    string;   // nom pré-rempli depuis le lien nominatif
  entityId?:       string | null; // entity Nexo pour auto-push
};

type Answers = Record<string, string | string[]>;

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value:    string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const strValue = Array.isArray(value) ? value[0] ?? "" : (value ?? "");
  const arrValue = Array.isArray(value) ? value : [];

  switch (question.type) {
    case "text":
      return (
        <textarea
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={3}
          placeholder="Votre réponse…"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          required={question.required}
          className="max-w-[160px]"
        />
      );

    case "yesno":
      return (
        <div className="flex gap-3">
          {["Oui", "Non"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                strValue === opt
                  ? "border-blue bg-blue text-white"
                  : "border-input bg-white text-muted-foreground hover:border-blue/50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case "single":
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                strValue === opt
                  ? "border-blue bg-blue/5 text-navy font-medium"
                  : "border-input bg-white text-muted-foreground hover:border-blue/30"
              )}
            >
              <span className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                strValue === opt ? "border-blue bg-blue" : "border-slate-300"
              )}>
                {strValue === opt && <span className="size-1.5 rounded-full bg-white" />}
              </span>
              {opt}
            </button>
          ))}
        </div>
      );

    case "multiple":
      return (
        <div className="space-y-2">
          {(question.options ?? []).map((opt) => {
            const checked = arrValue.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(
                  checked ? arrValue.filter((v) => v !== opt) : [...arrValue, opt]
                )}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                  checked
                    ? "border-blue bg-blue/5 text-navy font-medium"
                    : "border-input bg-white text-muted-foreground hover:border-blue/30"
                )}
              >
                <span className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border-2",
                  checked ? "border-blue bg-blue" : "border-slate-300"
                )}>
                  {checked && (
                    <svg className="size-2.5 text-white fill-current" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}

export function QuizForm({ questionnaireId, tenantId, questions, storageKey, prefillName = "", entityId = null }: Props) {
  const [name, setName]         = useState(prefillName);
  const [email, setEmail]       = useState("");
  const [answers, setAnswers]   = useState<Answers>({});
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]       = useState<{ score: number; maxScore: number } | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Restore draft from localStorage (offline support)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const draft = JSON.parse(saved) as { name?: string; email?: string; answers?: Answers };
        if (draft.name)    setName(draft.name);
        if (draft.email)   setEmail(draft.email);
        if (draft.answers) setAnswers(draft.answers);
      } catch { /* ignore */ }
    }

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [storageKey]);

  // Auto-save draft
  useEffect(() => {
    if (submitted) return;
    localStorage.setItem(storageKey, JSON.stringify({ name, email, answers }));
  }, [name, email, answers, submitted, storageKey]);

  function setAnswer(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOnline) {
      setError("Vous êtes hors ligne. Vos réponses sont sauvegardées — soumettez dès que vous êtes reconnecté.");
      return;
    }
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireId,
          tenantId,
          respondentName:  name,
          respondentEmail: email,
          answers,
          questions,
          entityId: entityId ?? undefined,
        }),
      });

      const data = await res.json() as { score?: number; maxScore?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de soumission.");

      localStorage.removeItem(storageKey);
      if (data.maxScore && data.maxScore > 0) {
        setScore({ score: data.score ?? 0, maxScore: data.maxScore });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
        <CheckCircle2 className="mx-auto size-12 text-green-500" />
        <h2 className="text-xl font-bold text-green-800">Réponses enregistrées !</h2>
        {score && score.maxScore > 0 && (
          <div className="space-y-1">
            <p className="text-3xl font-black text-green-700">
              {score.score} / {score.maxScore}
            </p>
            <p className="text-sm text-green-600">
              {Math.round((score.score / score.maxScore) * 100)}% de bonnes réponses
            </p>
          </div>
        )}
        <p className="text-sm text-green-600">
          Votre formateur recevra vos résultats et vous enverra son retour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <CloudOff className="size-4 shrink-0" />
          <span>Hors ligne — vos réponses sont sauvegardées localement et seront envoyées à la reconnexion.</span>
        </div>
      )}
      {isOnline && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <Wifi className="size-3" />En ligne
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Identité — masquée si le nom est pré-rempli via lien nominatif */}
      {prefillName ? (
        /* Nom pré-rempli : on affiche juste un champ email optionnel */
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <p className="text-xs font-semibold text-green-700">Identifié comme : {name}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email (optionnel — pour recevoir vos résultats)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sophie@entreprise.com" className="text-base h-11 bg-white" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vos informations</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Prénom et nom *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sophie Martin" required className="text-base h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sophie@entreprise.com" className="text-base h-11" />
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex items-start gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue/10 text-xs font-bold text-blue">
              {i + 1}
            </span>
            <p className="text-sm font-semibold text-navy leading-snug">
              {q.label}
              {q.required && <span className="ml-1 text-red-500">*</span>}
            </p>
          </div>
          <QuestionField
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        </div>
      ))}

      <Button
        type="submit"
        className="h-12 w-full text-base"
        disabled={pending || !isOnline}
      >
        {pending
          ? <><Loader2 className="mr-2 size-4 animate-spin" />Envoi…</>
          : !isOnline
            ? <><CloudOff className="mr-2 size-4" />En attente de connexion</>
            : <><Send className="mr-2 size-5" />Soumettre mes réponses</>
        }
      </Button>
    </form>
  );
}
