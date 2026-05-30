"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendQuizToRookiesAction } from "@/app/(dashboard)/nomade/training-actions";

export function SendQuizToRookiesButton({ questionnaireId }: { questionnaireId: string }) {
  const [result, setResult] = useState<string | null>(null);
  const [pending, start]    = useTransition();

  function handleClick() {
    setResult(null);
    start(async () => {
      const r = await sendQuizToRookiesAction(questionnaireId);
      if (r.success) {
        setResult(`✓ Envoyé à ${r.sent} stagiaire${r.sent > 1 ? "s" : ""}${r.failed > 0 ? ` (${r.failed} échec)` : ""}`);
      } else {
        setResult(`Erreur : ${r.error}`);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
          <CheckCircle2 className="size-3.5" />{result}
        </span>
      )}
      <Button size="sm" onClick={handleClick} disabled={pending}>
        {pending
          ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Envoi…</>
          : <><Send className="mr-1.5 size-3.5" />Envoyer aux stagiaires</>
        }
      </Button>
    </div>
  );
}
