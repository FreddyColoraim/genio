// ---------------------------------------------------------------------------
// members-config.ts — constants only, no server imports
// Safe to import from client components
// ---------------------------------------------------------------------------

import type { MemberRole } from "@/types/database.types";

export type { MemberRole };

export type MemberItem = {
  membershipId: string;
  userId:       string;
  name:         string;
  email:        string;
  role:         MemberRole;
  joinedAt:     string;
  isOwner:      boolean;
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner:       "Propriétaire",
  admin:       "Administrateur",
  rh:          "RH",
  manager:     "Manager",
  member:      "Membre",
  readonly:    "Lecture seule",
  field_agent: "Agent terrain",
  nurse:       "Infirmier",
  vet:         "Vétérinaire",
  craftsman:   "Artisan",
};

export const EDITABLE_ROLES: MemberRole[] = ["admin", "rh", "manager", "member", "readonly"];
