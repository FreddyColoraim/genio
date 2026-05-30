export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getQuestionnaires } from "@/services/questionnaire-service";
import type { Questionnaire } from "@/services/questionnaire-service";
import { ExercisesClient } from "@/components/nomade-formation/exercises-client";

export default async function ExercisesPage() {
  const questionnaires = await getQuestionnaires().catch(() => [] as Questionnaire[]);

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#0B3D2E] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link href={"/formation" as never} className="text-white/70 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Exercices &amp; Quiz</h1>
            <p className="text-white/60 text-xs mt-0.5">
              {questionnaires.length} questionnaire{questionnaires.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <ExercisesClient questionnaires={questionnaires} />
      </div>
    </div>
  );
}
