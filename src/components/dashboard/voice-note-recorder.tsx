"use client";

import { useRef, useState } from "react";
import { Mic, MicOff, Square, Loader2, AlertCircle } from "lucide-react";
import { uploadAndProcessVoiceNoteAction } from "@/app/(dashboard)/voice/actions";
import type { VoiceActionItem } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecorderState = "idle" | "recording" | "processing" | "error";

type Props = {
  onResult?: (result: {
    noteId: string;
    transcript: string;
    summary: string;
    actionItems: VoiceActionItem[];
  }) => void;
  className?: string;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceNoteRecorder({ onResult, className }: Props) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setErrorMsg(null);
    setDuration(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg("Accès au microphone refusé. Vérifiez les permissions de votre navigateur.");
      setState("error");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    // Pick best supported format
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      await submitRecording(recorder.mimeType || "audio/webm");
    };

    recorder.start(250); // collect data every 250ms
    setState("recording");

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setState("processing");
  }

  async function submitRecording(mimeType: string) {
    const ext = (mimeType.split(";")[0] ?? "audio/webm").split("/")[1] ?? "webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const file = new File([blob], `voice-note.${ext}`, { type: mimeType });

    const formData = new FormData();
    formData.set("audio", file);

    const result = await uploadAndProcessVoiceNoteAction(formData);

    if (!result.success) {
      setErrorMsg(result.error);
      setState("error");
      return;
    }

    setState("idle");
    onResult?.({
      noteId: result.noteId,
      transcript: result.transcript,
      summary: result.summary,
      actionItems: result.actionItems,
    });
  }

  function reset() {
    setErrorMsg(null);
    setDuration(0);
    setState("idle");
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Main record button */}
      <div className="relative flex items-center justify-center">
        {state === "recording" && (
          <span className="absolute inline-flex size-16 animate-ping rounded-full bg-red-400 opacity-30" />
        )}
        <Button
          aria-label={state === "recording" ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
          className={cn(
            "relative size-14 rounded-full transition-all",
            state === "recording"
              ? "bg-red-500 hover:bg-red-600 text-white"
              : state === "processing"
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          disabled={state === "processing"}
          onClick={state === "recording" ? stopRecording : state === "error" ? reset : startRecording}
          size="icon"
          type="button"
          variant="default"
        >
          {state === "processing" ? (
            <Loader2 className="size-6 animate-spin" />
          ) : state === "recording" ? (
            <Square className="size-5 fill-white" />
          ) : state === "error" ? (
            <MicOff className="size-6" />
          ) : (
            <Mic className="size-6" />
          )}
        </Button>
      </div>

      {/* Status label */}
      <div className="text-center text-sm">
        {state === "idle" && (
          <p className="text-muted-foreground">Appuyez pour commencer l'enregistrement</p>
        )}
        {state === "recording" && (
          <p className="font-mono text-red-500 font-medium tabular-nums">
            ● {formatDuration(duration)}
          </p>
        )}
        {state === "processing" && (
          <div className="space-y-1">
            <p className="text-muted-foreground">Transcription en cours…</p>
            <p className="text-xs text-muted-foreground">Claude analyse votre note</p>
          </div>
        )}
        {state === "error" && errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive max-w-xs">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs leading-5">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
