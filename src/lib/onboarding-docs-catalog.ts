// =============================================================================
// Catalogue des documents d'onboarding — 4 blocs
// action: 'collect' = document à récupérer auprès du candidat
//         'generate' = document à générer et remettre au candidat
// =============================================================================

export type DocBloc    = "administratif" | "rh" | "poste" | "outils";
export type DocAction  = "collect" | "generate";

export type DocField = {
  name:        string;
  label:       string;
  type:        "text" | "textarea" | "date";
  placeholder?: string;
  required?:   boolean;
};

export type DocTemplate = {
  id:          string;
  label:       string;
  description: string;
  bloc:        DocBloc;
  action:      DocAction;
  fields?:     DocField[];
};

// ---------------------------------------------------------------------------
// Catalogue complet
// ---------------------------------------------------------------------------

export const DOC_CATALOG: DocTemplate[] = [

  // ── BLOC 1 : Administratif ─────────────────────────────────────────────

  {
    id: "contrat",
    label: "Contrat de travail / promesse d'embauche",
    description: "Document contractuel signé entre l'employeur et le salarié.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "piece-identite",
    label: "Pièce d'identité",
    description: "Carte nationale d'identité ou passeport en cours de validité.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "rib",
    label: "RIB",
    description: "Relevé d'identité bancaire pour le virement du salaire.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "carte-vitale",
    label: "Carte Vitale / attestation SS",
    description: "Numéro de sécurité sociale pour l'affiliation mutuelle.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "justificatif-domicile",
    label: "Justificatif de domicile",
    description: "Facture ou quittance de moins de 3 mois.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "titre-sejour",
    label: "Titre de séjour / autorisation de travail",
    description: "Obligatoire pour les ressortissants hors UE.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "diplomes",
    label: "Diplômes et certifications",
    description: "Copies des diplômes et habilitations requis pour le poste.",
    bloc: "administratif", action: "collect",
  },
  {
    id: "contact-urgence",
    label: "Coordonnées d'urgence",
    description: "Personne à contacter en cas d'accident ou d'urgence.",
    bloc: "administratif", action: "collect",
  },

  // ── BLOC 2 : RH ───────────────────────────────────────────────────────

  {
    id: "livret-accueil",
    label: "Livret d'accueil",
    description: "Présentation de l'entreprise, valeurs, fonctionnement et contacts.",
    bloc: "rh", action: "generate",
    fields: [
      { name: "message",     label: "Message de bienvenue",      type: "textarea", placeholder: "Nous sommes ravis de vous accueillir…", required: true },
      { name: "description", label: "Description de l'entreprise", type: "textarea", placeholder: "Fondée en…, notre mission est de…" },
      { name: "valeurs",     label: "Valeurs (séparées par des virgules)", type: "text", placeholder: "Confiance, Innovation, Bienveillance" },
      { name: "contacts",    label: "Contacts clés (RH, IT, manager)", type: "textarea", placeholder: "RH : Marie Dupont — 06 …" },
    ],
  },
  {
    id: "reglement-interieur",
    label: "Règlement intérieur",
    description: "Règles de vie commune, horaires, sécurité et discipline.",
    bloc: "rh", action: "generate",
    fields: [
      { name: "horaires",    label: "Horaires de travail",          type: "text",     placeholder: "9h–18h, du lundi au vendredi" },
      { name: "teletravail", label: "Politique télétravail",        type: "text",     placeholder: "2 jours/semaine autorisés" },
      { name: "conges",      label: "Politique congés",             type: "textarea", placeholder: "25 jours ouvrés + RTT…" },
      { name: "specifiques", label: "Règles spécifiques (optionnel)", type: "textarea", placeholder: "Tenue vestimentaire, confidentialité…" },
    ],
  },
  {
    id: "charte-informatique",
    label: "Charte informatique",
    description: "Usage des équipements, données personnelles et bonnes pratiques.",
    bloc: "rh", action: "generate",
    fields: [
      { name: "outils",    label: "Outils mis à disposition",      type: "text",     placeholder: "MacBook Pro, Slack, Gmail…" },
      { name: "interdits", label: "Usages interdits",              type: "textarea", placeholder: "Logiciels non autorisés, partage de données…" },
      { name: "it-contact",label: "Contact IT / support",          type: "text",     placeholder: "it@company.com — ext. 200" },
    ],
  },
  {
    id: "politique-teletravail",
    label: "Politique télétravail",
    description: "Conditions, fréquence et règles du travail à distance.",
    bloc: "rh", action: "generate",
    fields: [
      { name: "frequence",  label: "Fréquence autorisée",  type: "text",     placeholder: "2 jours/semaine" },
      { name: "conditions", label: "Conditions requises",  type: "textarea", placeholder: "Connexion stable, espace dédié…" },
      { name: "process",    label: "Process de validation", type: "textarea", placeholder: "Demande 24h à l'avance via…" },
    ],
  },
  {
    id: "mutuelle",
    label: "Documents mutuelle & prévoyance",
    description: "Formulaire d'adhésion et informations sur la couverture santé.",
    bloc: "rh", action: "collect",
  },
  {
    id: "nda",
    label: "Politique de confidentialité / NDA",
    description: "Engagement de confidentialité sur les informations de l'entreprise.",
    bloc: "rh", action: "collect",
  },

  // ── BLOC 3 : Poste ────────────────────────────────────────────────────

  {
    id: "fiche-poste",
    label: "Fiche de poste",
    description: "Intitulé, missions, responsabilités et périmètre du poste.",
    bloc: "poste", action: "generate",
    fields: [
      { name: "mission",          label: "Mission principale",       type: "textarea", placeholder: "Le/la [poste] a pour mission de…", required: true },
      { name: "responsabilites",  label: "Responsabilités clés",     type: "textarea", placeholder: "• Gérer…\n• Coordonner…\n• Assurer…" },
      { name: "competences",      label: "Compétences attendues",    type: "textarea", placeholder: "3 ans d'expérience en…, maîtrise de…" },
      { name: "kpis",             label: "Indicateurs de succès",    type: "textarea", placeholder: "Taux de satisfaction, délai de livraison…" },
    ],
  },
  {
    id: "objectifs-30-60-90",
    label: "Objectifs des 30 / 60 / 90 premiers jours",
    description: "Feuille de route claire pour les 3 premiers mois.",
    bloc: "poste", action: "generate",
    fields: [
      { name: "objectifs30", label: "Objectifs J30 — Découverte",   type: "textarea", placeholder: "Connaître l'équipe, maîtriser les outils…", required: true },
      { name: "objectifs60", label: "Objectifs J60 — Montée en charge", type: "textarea", placeholder: "Prendre en charge 2 projets…" },
      { name: "objectifs90", label: "Objectifs J90 — Autonomie",    type: "textarea", placeholder: "Livrer un premier projet complet…" },
    ],
  },
  {
    id: "planning-integration",
    label: "Planning d'intégration J1 / J7 / J30",
    description: "Agenda structuré des premières semaines.",
    bloc: "poste", action: "generate",
    fields: [
      { name: "j1",          label: "Programme du Jour 1",          type: "textarea", placeholder: "9h : accueil RH\n10h : visite locaux\n14h : RDV manager…", required: true },
      { name: "semaine1",    label: "Programme Semaine 1",          type: "textarea", placeholder: "Formations, rencontres équipe, premiers livrables…" },
      { name: "mois1",       label: "Programme Mois 1",             type: "textarea", placeholder: "Montée en compétences, premiers objectifs…" },
      { name: "buddy",       label: "Nom du buddy / mentor",        type: "text",     placeholder: "Prénom NOM — poste" },
    ],
  },
  {
    id: "contacts-cles",
    label: "Contacts clés",
    description: "Annuaire des personnes ressources à connaître dès l'arrivée.",
    bloc: "poste", action: "generate",
    fields: [
      { name: "manager",  label: "Manager direct",          type: "text", placeholder: "Prénom NOM — manager@company.com", required: true },
      { name: "rh",       label: "Référent RH",             type: "text", placeholder: "Prénom NOM — rh@company.com" },
      { name: "buddy",    label: "Buddy / mentor",          type: "text", placeholder: "Prénom NOM — buddy@company.com" },
      { name: "it",       label: "Support IT",              type: "text", placeholder: "it@company.com — ext. 200" },
      { name: "autres",   label: "Autres contacts (optionnel)", type: "textarea", placeholder: "Finance, Direction, Réception…" },
    ],
  },
  {
    id: "organigramme",
    label: "Organigramme",
    description: "Structure de l'équipe et place dans l'organisation.",
    bloc: "poste", action: "collect",
  },

  // ── BLOC 4 : Outils & accès ───────────────────────────────────────────

  {
    id: "liste-acces",
    label: "Liste des outils et accès à préparer",
    description: "Tous les comptes et droits à créer avant l'arrivée.",
    bloc: "outils", action: "generate",
    fields: [
      { name: "outils-metier", label: "Outils métier",              type: "textarea", placeholder: "Slack, Notion, Jira, Figma…", required: true },
      { name: "acces-data",    label: "Accès données / serveurs",   type: "textarea", placeholder: "Google Drive, GitHub, base de données…" },
      { name: "materiels",     label: "Matériel à préparer",        type: "textarea", placeholder: "MacBook, badge, téléphone…" },
      { name: "it-delai",      label: "Délai de provisioning IT",   type: "text",     placeholder: "J-5 avant l'arrivée" },
    ],
  },
  {
    id: "checklist-onboarding",
    label: "Checklist d'onboarding",
    description: "Liste complète des actions avant, pendant et après l'arrivée.",
    bloc: "outils", action: "generate",
    fields: [
      { name: "avant-j1",  label: "Avant J1 (actions RH / IT)",    type: "textarea", placeholder: "□ Contrat signé\n□ Accès créés\n□ Matériel prêt…", required: true },
      { name: "j1",        label: "Le Jour J",                     type: "textarea", placeholder: "□ Accueil physique\n□ Présentation équipe…" },
      { name: "semaine1",  label: "Semaine 1",                     type: "textarea", placeholder: "□ Formations\n□ Points manager…" },
      { name: "mois1",     label: "Fin de Mois 1",                 type: "textarea", placeholder: "□ Bilan onboarding\n□ Objectifs ajustés…" },
    ],
  },
  {
    id: "guide-outils",
    label: "Guide d'utilisation des outils",
    description: "Prise en main rapide des outils internes.",
    bloc: "outils", action: "generate",
    fields: [
      { name: "outils",      label: "Outils listés",                type: "textarea", placeholder: "Slack, Notion, Jira…", required: true },
      { name: "ressources",  label: "Ressources / liens documentation", type: "textarea", placeholder: "https://notion.so/… , https://…" },
      { name: "tips",        label: "Bonnes pratiques et tips",     type: "textarea", placeholder: "Pour Slack, rejoindre les canaux #general…" },
    ],
  },
  {
    id: "notes-frais",
    label: "Politique notes de frais",
    description: "Process de remboursement et plafonds autorisés.",
    bloc: "outils", action: "generate",
    fields: [
      { name: "outil",     label: "Outil de saisie",      type: "text",     placeholder: "Spendesk, Expensify, feuille Excel…" },
      { name: "plafonds",  label: "Plafonds par catégorie", type: "textarea", placeholder: "Repas : 25€\nTransport : selon réel\nHôtel : 150€…" },
      { name: "delai",     label: "Délai de soumission",   type: "text",     placeholder: "Avant le 5 du mois suivant" },
    ],
  },
  {
    id: "plan-locaux",
    label: "Plan des locaux / guide d'accès",
    description: "Adresse, accès, parkings, salles, espaces communs.",
    bloc: "outils", action: "collect",
  },
  {
    id: "faq-interne",
    label: "FAQ interne",
    description: "Réponses aux questions les plus fréquentes des nouveaux arrivants.",
    bloc: "outils", action: "collect",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const BLOC_META: Record<DocBloc, { label: string; description: string; color: string }> = {
  administratif: { label: "Administratif",  description: "Documents légaux et d'identité",       color: "text-blue-700 bg-blue-50 border-blue-200" },
  rh:            { label: "RH",             description: "Politiques, charte et vie interne",     color: "text-purple-700 bg-purple-50 border-purple-200" },
  poste:         { label: "Poste",          description: "Mission, objectifs et planning",        color: "text-green-700 bg-green-50 border-green-200" },
  outils:        { label: "Outils & accès", description: "Systèmes, matériel et procédures",      color: "text-amber-700 bg-amber-50 border-amber-200" },
};

export const BLOCS: DocBloc[] = ["administratif", "rh", "poste", "outils"];

export function getDocsByBloc(bloc: DocBloc) {
  return DOC_CATALOG.filter((d) => d.bloc === bloc);
}

export function getDocById(id: string) {
  return DOC_CATALOG.find((d) => d.id === id);
}
