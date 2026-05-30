"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ClipboardList, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createQuizAction } from "@/app/(dashboard)/nomade/training-actions";
import type { Questionnaire } from "@/services/questionnaire-service";
import type { TrainingSession } from "@/services/training-config";

const QUESTION_TYPES = [
  { value: "text",     label: "Texte libre" },
  { value: "single",   label: "Choix unique" },
  { value: "multiple", label: "Choix multiple" },
  { value: "yesno",    label: "Oui / Non" },
  { value: "number",   label: "Nombre" },
];

type DraftQuestion = {
  id:       string;
  type:     string;
  label:    string;
  options:  string[];
  correct:  string;
  required: boolean;
};

function QuizCard({ quiz, appUrl }: { quiz: Questionnaire; appUrl: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${appUrl}/quiz/${quiz.accessToken}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-navy">{quiz.title}</p>
          {quiz.sessionTitle && (
            <p className="text-xs text-muted-foreground">Session : {quiz.sessionTitle}</p>
          )}
        </div>
        <Badge variant="soft" className="shrink-0 text-xs">
          {quiz.responseCount} réponse{quiz.responseCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
      </p>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={copy}>
          {copied
            ? <><CheckCircle2 className="size-3 text-green-500" />Copié !</>
            : <><Copy className="size-3" />Copier le lien</>}
        </Button>
      </div>
    </div>
  );
}

function QuestionBuilder({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: DraftQuestion;
  index:    number;
  onChange: (q: DraftQuestion) => void;
  onRemove: () => void;
}) {
  const needsOptions = question.type === "single" || question.type === "multiple";

  return (
    <div className="rounded-lg border bg-warm/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-red-500 transition-colors">
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
        <Input
          placeholder="Intitulé de la question"
          value={question.label}
          onChange={(e) => onChange({ ...question, label: e.target.value })}
          className="text-sm"
        />
        <select
          value={question.type}
          onChange={(e) => onChange({ ...question, type: e.target.value, options: [] })}
          className="h-10 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {needsOptions && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground">Options (une par ligne)</p>
          <textarea
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            placeholder={"Option A\nOption B\nOption C"}
            value={question.options.join("\n")}
            onChange={(e) => onChange({ ...question, options: e.target.value.split("\n") })}
          />
        </div>
      )}

      {question.type !== "text" && question.type !== "number" && (
        <Input
          placeholder="Réponse correcte (pour l'auto-correction)"
          value={question.correct}
          onChange={(e) => onChange({ ...question, correct: e.target.value })}
          className="text-xs"
        />
      )}
    </div>
  );
}

function CreateQuizForm({ sessions, onDone }: { sessions: TrainingSession[]; onDone: () => void }) {
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addQuestion() {
    setQuestions((qs) => [...qs, {
      id: crypto.randomUUID(),
      type: "text",
      label: "",
      options: [],
      correct: "",
      required: true,
    }]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (questions.length === 0) { setError("Ajoutez au moins une question."); return; }
    setError(null);
    const fd = new FormData(e.currentTarget);
    const cleanedQuestions = questions.map((q) => ({
      id:       q.id,
      type:     q.type,
      label:    q.label.trim(),
      options:  q.options.filter(Boolean),
      correct:  q.correct.trim() || undefined,
      required: q.required,
    }));
    fd.set("questionsJson", JSON.stringify(cleanedQuestions));
    startTransition(async () => {
      const result = await createQuizAction(fd);
      if (result.success) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-5">
      <p className="text-sm font-semibold text-navy">Nouveau questionnaire</p>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="space-y-1.5">
        <Label className="text-xs">Titre *</Label>
        <Input name="title" placeholder="Quiz sécurité incendie" required />
      </div>

      {sessions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Session associée</Label>
          <select name="sessionId"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">— Aucune —</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Questions ({questions.length})</Label>
          <Button type="button" size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={addQuestion}>
            <Plus className="size-3" />Ajouter
          </Button>
        </div>
        {questions.map((q, i) => (
          <QuestionBuilder
            key={q.id}
            question={q}
            index={i}
            onChange={(updated) => setQuestions((qs) => qs.map((x) => x.id === q.id ? updated : x))}
            onRemove={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Créer le questionnaire"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>Annuler</Button>
      </div>
    </form>
  );
}

type Props = {
  questionnaires: Questionnaire[];
  sessions:       TrainingSession[];
  appUrl:         string;
};

export function NomadeQuestionnaires({ questionnaires, sessions, appUrl }: Props) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-navy">
            Questionnaires
            {questionnaires.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue/10 px-2 py-0.5 text-xs font-medium text-blue">
                {questionnaires.length}
              </span>
            )}
          </h3>
        </div>
        {!creating && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" />Nouveau quiz
          </Button>
        )}
      </div>

      {creating && <CreateQuizForm sessions={sessions} onDone={() => setCreating(false)} />}

      {questionnaires.length === 0 && !creating ? (
        <div className="rounded-xl border border-dashed bg-warm/30 p-8 text-center">
          <ClipboardList className="mx-auto size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun questionnaire. Créez un quiz à envoyer aux rookies.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {questionnaires.map((q) => <QuizCard key={q.id} quiz={q} appUrl={appUrl} />)}
        </div>
      )}
    </div>
  );
}
