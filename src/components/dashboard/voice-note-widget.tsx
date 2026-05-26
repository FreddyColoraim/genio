"use client";

import { useState } from "react";
import { VoiceNoteRecorder } from "./voice-note-recorder";
import { VoiceActionProposals } from "./voice-action-proposals";
import type { VoiceActionItem } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";

type RecordingResult = {
  noteId: string;
  transcript: string;
  summary: string;
  actionItems: VoiceActionItem[];
};

export function VoiceNoteWidget({ className }: { className?: string }) {
  const [result, setResult] = useState<RecordingResult | null>(null);

  function handleResult(r: RecordingResult) {
    setResult(r);
  }

  function handleDone() {
    setResult(null);
  }

  return (
    <div className={className}>
      {!result ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <VoiceNoteRecorder onResult={handleResult} />
          </CardContent>
        </Card>
      ) : (
        <VoiceActionProposals
          noteId={result.noteId}
          transcript={result.transcript}
          summary={result.summary}
          actionItems={result.actionItems}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
