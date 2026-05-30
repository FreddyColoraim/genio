export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { getTrainingSessions } from "@/services/training-service";
import { TRAINING_TYPE_LABELS } from "@/services/training-config";
import type { TrainingSession } from "@/services/training-config";
import { SessionsClient } from "@/components/nomade-formation/sessions-client";

export default async function SessionsPage() {
  const sessions = await getTrainingSessions().catch(() => [] as TrainingSession[]);

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#0B3D2E] px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={"/formation" as never} className="text-white/70 hover:text-white">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-xl">Sessions</h1>
              <p className="text-white/60 text-xs mt-0.5">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <SessionsClient sessions={sessions} typeLabels={TRAINING_TYPE_LABELS} />
      </div>
    </div>
  );
}
