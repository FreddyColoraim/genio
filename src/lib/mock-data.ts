import type { Employee } from "@/types/employee";

export const onboardingMetrics = [
  { label: "Onboardings actifs", value: "24", detail: "+8 ce mois-ci", tone: "blue" },
  { label: "Taux de complétion", value: "86%", detail: "12% au-dessus de l'objectif", tone: "sage" },
  { label: "Documents en attente", value: "17", detail: "5 à vérifier", tone: "lavender" },
  { label: "Temps avant autonomie", value: "4,2 j", detail: "1,1 j plus rapide", tone: "navy" }
] as const;

export const mockEmployees: Employee[] = [
  {
    id: "emp_001",
    name: "Maya Chen",
    email: "maya.chen@nexo-rh.com",
    role: "Designer produit",
    accessRole: "employee",
    department: "Produit",
    manager: "Alex Morgan",
    startDate: "20 mai 2026",
    progress: 78,
    status: "In progress",
    pendingDocuments: 2
  },
  {
    id: "emp_002",
    name: "Noah Martin",
    email: "noah.martin@nexo-rh.com",
    role: "Partenaire RH",
    accessRole: "hr",
    department: "RH",
    manager: "Sarah Lee",
    startDate: "24 mai 2026",
    progress: 42,
    status: "Waiting",
    pendingDocuments: 4
  },
  {
    id: "emp_003",
    name: "Lina Gomez",
    email: "lina.gomez@nexo-rh.com",
    role: "Manager engineering",
    accessRole: "manager",
    department: "Engineering",
    manager: "Priya Shah",
    startDate: "1 juin 2026",
    progress: 92,
    status: "Complete",
    pendingDocuments: 0
  }
];
