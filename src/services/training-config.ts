// Types et constantes sans imports serveur — safe pour les client components

export type TrainingType = "product" | "security" | "procedure" | "regulatory" | "other";

export const TRAINING_TYPE_LABELS: Record<TrainingType, { label: string; color: string }> = {
  product:     { label: "Produit",       color: "bg-blue/10 text-blue"           },
  security:    { label: "Sécurité",      color: "bg-red-50 text-red-700"         },
  procedure:   { label: "Procédure",     color: "bg-amber-50 text-amber-700"     },
  regulatory:  { label: "Réglementaire", color: "bg-purple-50 text-purple-700"   },
  other:       { label: "Autre",         color: "bg-slate-100 text-slate-600"    },
};

export type TrainingSession = {
  id:              string;
  title:           string;
  type:            TrainingType;
  description:     string | null;
  durationMinutes: number;
  materialsUrl:    string | null;
  isActive:        boolean;
  createdAt:       string;
  assignedCount:   number;
};

export type TrainingAssignment = {
  id:           string;
  sessionId:    string;
  sessionTitle: string;
  sessionType:  TrainingType;
  entityId:     string;
  entityName:   string;
  assignedAt:   string;
  completedAt:  string | null;
};
