export type WorkspaceIndustry = "restaurant" | "services" | "transport" | "retail" | "office";

export type WorkspaceProfile = {
  id: string;
  name: string;
  industry: WorkspaceIndustry;
  teamSize: string;
  operatingMode: string;
};

export const workspaceIndustryLabels: Record<WorkspaceIndustry, string> = {
  restaurant: "Restaurant / hôtellerie",
  services: "Services",
  transport: "Transport / logistique",
  retail: "Commerce / retail",
  office: "Bureau / fonctions support"
};
