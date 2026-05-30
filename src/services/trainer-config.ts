// Types formateurs — sans imports serveur (safe pour client components)

export type Trainer = {
  id:           string;
  name:         string;
  email:        string;
  phone:        string | null;
  bio:          string | null;
  avatarUrl:    string | null;
  competences:  string[];
  specialties:  string[];
  accessToken:  string;
  isActive:     boolean;
  createdAt:    string;
  sessionCount: number;
};

export type TrainerSession = {
  id:           string;
  trainerId:    string;
  sessionId:    string;
  sessionTitle: string;
  sessionType:  string;
  isLead:       boolean;
  assignedAt:   string;
};

export const SPECIALTY_OPTIONS = [
  "Onboarding",
  "Réglementation",
  "Hygiène & sécurité",
  "Produit / service",
  "Procédures internes",
  "Management",
  "Relation client",
  "Outils & logiciels",
  "Formation terrain",
] as const;
