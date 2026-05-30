"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, StopCircle } from "lucide-react";

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceRecorderPlaceholder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [recording]);

  function toggle() {
    if (recording) {
      setRecording(false);
      setSeconds(0);
    } else {
      setRecording(true);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer */}
      <p className={`text-3xl font-mono font-bold tabular-nums transition-colors ${recording ? "text-red-500" : "text-slate-300"}`}>
        {formatTimer(seconds)}
      </p>

      {/* Mic button */}
      <button
        onClick={toggle}
        className={`flex size-24 items-center justify-center rounded-full shadow-lg transition-all active:scale-95 ${
          recording
            ? "bg-red-500 shadow-red-200 animate-pulse"
            : "bg-red-500 shadow-red-200"
        }`}
      >
        {recording ? (
          <StopCircle className="size-10 text-white" />
        ) : (
          <Mic className="size-10 text-white" />
        )}
      </button>

      <p className="text-sm text-slate-400 font-medium">
        {recording ? "Appuyez pour arrêter" : "Appuyez pour enregistrer"}
      </p>
    </div>
  );
}
