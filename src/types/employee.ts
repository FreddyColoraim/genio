import type { UserRole } from "@/types/roles";

export type OnboardingStatus = "Not started" | "In progress" | "Waiting" | "Complete";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  accessRole: UserRole;
  department: string;
  manager: string;
  startDate: string;
  progress: number;
  status: OnboardingStatus;
  pendingDocuments: number;
};

export const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  "Not started": "Non démarré",
  "In progress": "En cours",
  Waiting: "En attente",
  Complete: "Terminé"
};
