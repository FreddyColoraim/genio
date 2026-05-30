export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { getPipelineData } from "@/services/pipeline-service";
import { RH_STAGES, SOURCE_LABELS } from "@/services/pipeline-service";
import type { CandidateCard, PipelineStage } from "@/services/pipeline-service";

const STAGE_COLORS: Partial<Record<PipelineStage, string>> = {
  new:       "bg-slate-100 text-slate-600",
  contacted: "bg-blue-100 text-blue-700",
  interview: "bg-violet-100 text-violet-700",
  retained:  "bg-emerald-100 text-emerald-700",
  refused:   "bg-red-100 text-red-700",
};

function StarRating({ score }: { score: number | null }) {
  if (!score) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3 ${i <= score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function CandidateKanbanCard({ card }: { card: CandidateCard }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-3 flex flex-col gap-1.5">
      <p className="font-semibold text-[#1B2A4A] text-sm leading-tight">{card.name}</p>
      {card.briefTitle && (
        <p className="text-xs text-slate-500 truncate">{card.briefTitle}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
        {card.source && (
          <span className="rounded-full bg-[#1B2A4A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1B2A4A]">
            {SOURCE_LABELS[card.source] ?? card.source}
          </span>
        )}
      </div>
      <StarRating score={card.score} />
    </div>
  );
}

function KanbanColumn({
  stage,
  label,
  cards,
}: {
  stage: PipelineStage;
  label: string;
  cards: CandidateCard[];
}) {
  return (
    <div className="flex-shrink-0 w-64 flex flex-col gap-2">
      <div className="flex items-center gap-2 pb-1">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STAGE_COLORS[stage]}`}>
          {label}
        </span>
        <span className="text-xs text-slate-400 font-medium">{cards.length}</span>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-400">Aucun candidat</p>
        </div>
      ) : (
        cards.map((c) => <CandidateKanbanCard key={c.pipelineId} card={c} />)
      )}
    </div>
  );
}

export default async function PipelinePage() {
  const data = await getPipelineData().catch(() => ({ columns: RH_STAGES.map((s) => ({ ...s, cards: [] })), briefs: [] }));

  // Filter to event (terrain) source only
  const columns = data.columns.map((col) => ({
    ...col,
    cards: col.cards.filter((c) => c.source === "event"),
  }));

  const total = columns.reduce((sum, col) => sum + col.cards.length, 0);

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link href={"/terrain" as never} className="text-white/70 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Pipeline Terrain</h1>
            <p className="text-white/60 text-xs mt-0.5">
              {total} candidat{total !== 1 ? "s" : ""} en cours
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal scroll kanban */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 p-4" style={{ width: "max-content" }}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.stage}
              stage={col.stage}
              label={col.label}
              cards={col.cards}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
