// ---------------------------------------------------------------------------
// brief-config.ts — constants only, no server imports
// Safe to import from client components
// ---------------------------------------------------------------------------

export type BriefUrgency = "low" | "normal" | "high" | "urgent";
export type BriefStatus  = "draft" | "open" | "closed" | "archived";

export type BriefItem = {
  id:           string;
  title:        string;
  description:  string;
  missions:     string;
  profile:      string;
  competences:  string;
  notes:        string;
  contractType: string;
  location:     string;
  urgency:      BriefUrgency;
  status:       BriefStatus;
  createdAt:    string;
  updatedAt:    string;
};

export const urgencyLabels: Record<BriefUrgency, string> = {
  low:    "Faible",
  normal: "Normal",
  high:   "Prioritaire",
  urgent: "Urgent",
};

export const statusLabels: Record<BriefStatus, string> = {
  draft:    "Brouillon",
  open:     "Ouvert",
  closed:   "Clôturé",
  archived: "Archivé",
};
