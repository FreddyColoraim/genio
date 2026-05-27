// ---------------------------------------------------------------------------
// pipeline-config.ts — constants only, no server imports
// Safe to import from client components
// ---------------------------------------------------------------------------

import type { PipelineStage, AcquisitionSource } from "@/types/database.types";

export type { PipelineStage, AcquisitionSource };

export type CandidateCard = {
  pipelineId:  string;
  entityId:    string;
  name:        string;
  email:       string;
  stage:       PipelineStage;
  source:      AcquisitionSource | null;
  notes:       string | null;
  score:       number | null;
  briefId:     string | null;
  briefTitle:  string | null;
  movedAt:     string;
};

export type PipelineColumn = {
  stage: PipelineStage;
  label: string;
  cards: CandidateCard[];
};

export type PipelineData = {
  columns: PipelineColumn[];
  briefs:  { id: string; title: string }[];
};

// Étapes RH dans l'ordre
export const RH_STAGES: { stage: PipelineStage; label: string; description: string }[] = [
  { stage: "new",       label: "Nouveau",   description: "Candidatures reçues" },
  { stage: "contacted", label: "Contacté",  description: "Premier contact établi" },
  { stage: "interview", label: "Entretien", description: "Entretien planifié ou passé" },
  { stage: "retained",  label: "Retenu",    description: "Candidat sélectionné" },
  { stage: "refused",   label: "Refusé",    description: "Candidature non retenue" },
];

export const SOURCE_LABELS: Record<AcquisitionSource, string> = {
  linkedin:   "LinkedIn",
  website:    "Site carrière",
  ad:         "Annonce",
  referral:   "Référence",
  cooptation: "Cooptation",
  event:      "Événement",
  other:      "Autre",
};
