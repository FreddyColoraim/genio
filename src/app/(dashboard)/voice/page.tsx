import type { Metadata } from "next";
import { VoiceNoteWidget } from "@/components/dashboard/voice-note-widget";

export const metadata: Metadata = {
  title: "Notes vocales | GeniO",
  description: "Enregistrez des notes vocales et laissez l'IA extraire vos actions.",
};

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notes vocales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enregistrez une note — GeniO la transcrit et extrait automatiquement vos actions.
        </p>
      </div>
      <VoiceNoteWidget />
    </div>
  );
}
