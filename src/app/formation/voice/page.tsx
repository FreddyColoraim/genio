export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Mic, ExternalLink } from "lucide-react";
import { VoiceRecorderPlaceholder } from "@/components/nomade-formation/voice-recorder";

export default function FormationVoicePage() {
  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#0B3D2E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link href={"/formation" as never} className="text-white/70 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Note Vocale</h1>
            <p className="text-white/60 text-xs mt-0.5">Formateur</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center flex-1 p-6 gap-8 min-h-[60vh]">
        {/* Big mic button */}
        <VoiceRecorderPlaceholder />

        {/* Info note */}
        <div className="rounded-2xl bg-white shadow-sm p-4 w-full max-w-sm text-center flex flex-col gap-3">
          <div className="flex items-center justify-center size-10 rounded-full bg-[#F0FDF4] mx-auto">
            <Mic className="size-5 text-[#0B3D2E]" />
          </div>
          <p className="text-sm font-semibold text-[#0B3D2E]">Note vocale</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            En cours de développement — la note vocale est disponible via l&apos;onglet <strong>Notes</strong> de votre compte Nexo RH.
          </p>
          <Link
            href={"/voice" as never}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0B3D2E] py-2.5 text-sm font-semibold text-white"
          >
            <ExternalLink className="size-4" /> Ouvrir Nexo RH — Notes vocales
          </Link>
        </div>
      </div>
    </div>
  );
}
