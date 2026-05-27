// =============================================================================
// Configuration métier — 8 secteurs
// Couleurs · Jargon · Rôles · Documents · Réglementations · Marketing · Brevo
// =============================================================================

export type SectorColors = {
  primary: string;
  secondary: string;
  accent: string;
  tw: {
    bg: string;
    bgLight: string;
    text: string;
    textDark: string;
    border: string;
    ring: string;
    badge: string;
  };
};

export type SectorRole = {
  key: string;
  label: string;
  labelFeminine: string;
  description: string;
  isAdmin: boolean;
  permissions: string[];
};

export type SectorDocument = {
  id: string;
  title: string;
  description: string;
  category: "administrative" | "regulatory" | "training" | "equipment" | "health" | "safety" | "hr";
  isMandatory: boolean;
  regulation?: string;
  action: "collect" | "generate" | "sign";
  renewalMonths?: number;
};

export type SectorRegulation = {
  code: string;
  label: string;
  description: string;
  url?: string;
};

export type SectorProcedure = {
  id: string;
  trigger: string;
  title: string;
  steps: string[];
};

export type SectorMarketing = {
  headline: string;
  subheadline: string;
  description: string;
  painPoints: { icon: string; title: string; description: string }[];
  benefits: { icon: string; title: string; description: string }[];
  stats: { value: string; label: string }[];
  cta: string;
  ctaSecondary: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
};

export type SectorConfig = {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  tagline: string;
  colors: SectorColors;
  labels: {
    member: string;
    memberPlural: string;
    memberFeminine: string;
    team: string;
    teamPlural: string;
    onboarding: string;
    arrival: string;
    manager: string;
    managerPlural: string;
    brief: string;
    pipeline: string;
  };
  jargon: Record<string, string>;
  roles: SectorRole[];
  documents: SectorDocument[];
  regulations: SectorRegulation[];
  procedures: SectorProcedure[];
  marketing: SectorMarketing;
  brevo: {
    listId: number;
    segmentTag: string;
  };
};

// =============================================================================
// 1. SERVICES À LA PERSONNE
// =============================================================================
const sap: SectorConfig = {
  id: "sap",
  slug: "services-a-la-personne",
  label: "Services à la personne",
  emoji: "🏠",
  tagline: "Coordonnez vos intervenants, rassurez les familles.",
  colors: {
    primary: "#F97316",
    secondary: "#FED7AA",
    accent: "#EA580C",
    tw: {
      bg: "bg-orange-500",
      bgLight: "bg-orange-50",
      text: "text-orange-500",
      textDark: "text-orange-700",
      border: "border-orange-200",
      ring: "ring-orange-500",
      badge: "border-orange-200 bg-orange-50 text-orange-700",
    },
  },
  labels: {
    member: "intervenant",
    memberPlural: "intervenants",
    memberFeminine: "intervenante",
    team: "tournée",
    teamPlural: "tournées",
    onboarding: "Parcours intervenant",
    arrival: "Nouvelle affectation",
    manager: "coordinateur de secteur",
    managerPlural: "coordinateurs de secteur",
    brief: "Demande d'affectation",
    pipeline: "Recrutement intervenants",
  },
  jargon: {
    collaborateur: "intervenant",
    équipe: "tournée",
    onboarding: "parcours d'accueil",
    manager: "coordinateur de secteur",
    objectifs: "suivi de prise en poste terrain",
    documents: "dossier intervenant",
    "outils & accès": "compétences & certifications",
    "brief RH": "fiche bénéficiaire",
    "nouvelles arrivées": "nouvelles affectations bénéficiaires",
    notes: "compte-rendu visite",
  },
  roles: [
    {
      key: "coordinator",
      label: "Coordinateur RH",
      labelFeminine: "Coordinatrice RH",
      description: "Gère les intervenants, planifie les tournées et suit les dossiers.",
      isAdmin: true,
      permissions: ["members:write", "documents:write", "analytics:read", "settings:write"],
    },
    {
      key: "sector_manager",
      label: "Responsable de secteur",
      labelFeminine: "Responsable de secteur",
      description: "Supervise un groupe d'intervenants sur une zone géographique.",
      isAdmin: false,
      permissions: ["members:read", "members:write", "documents:read"],
    },
    {
      key: "caregiver",
      label: "Intervenant à domicile",
      labelFeminine: "Intervenante à domicile",
      description: "Effectue les interventions auprès des bénéficiaires.",
      isAdmin: false,
      permissions: ["documents:read"],
    },
    {
      key: "quality_manager",
      label: "Responsable qualité",
      labelFeminine: "Responsable qualité",
      description: "Suit les certifications, les évaluations et la conformité.",
      isAdmin: false,
      permissions: ["members:read", "documents:read", "analytics:read"],
    },
  ],
  documents: [
    { id: "sap-carte-vitale", title: "Carte Vitale", description: "Attestation de droits à la SS.", category: "administrative", isMandatory: true, action: "collect" },
    { id: "sap-diplome-advf", title: "Diplôme ADVF / BEP Sanitaire & Social", description: "Justificatif de qualification pour auxiliaire de vie.", category: "administrative", isMandatory: false, action: "collect", regulation: "CASF Art. L347-1" },
    { id: "sap-casier-judiciaire", title: "Extrait de casier judiciaire B3", description: "Obligatoire pour intervention auprès de publics vulnérables.", category: "regulatory", isMandatory: true, action: "collect", regulation: "Art. L133-6 CASF" },
    { id: "sap-psc1", title: "Attestation PSC1 / SST", description: "Formation premiers secours, validité recommandée 24 mois.", category: "training", isMandatory: false, action: "collect", renewalMonths: 24 },
    { id: "sap-permis", title: "Permis de conduire", description: "Nécessaire pour les tournées en véhicule.", category: "administrative", isMandatory: false, action: "collect" },
    { id: "sap-assurance-auto", title: "Attestation assurance véhicule", description: "Assurance personnelle couvrant l'usage professionnel.", category: "regulatory", isMandatory: false, action: "collect", renewalMonths: 12 },
    { id: "sap-visite-medicale", title: "Fiche aptitude médicale", description: "Visite d'aptitude au poste, renouvellement selon le poste.", category: "health", isMandatory: true, action: "collect", renewalMonths: 24 },
    { id: "sap-parcours", title: "Parcours d'intégration intervenant", description: "Planning J1, formation interne, découverte bénéficiaires.", category: "hr", isMandatory: true, action: "generate" },
    { id: "sap-charte-bientraitance", title: "Charte de bientraitance", description: "Engagement du personnel envers les bénéficiaires.", category: "hr", isMandatory: true, action: "sign" },
    { id: "sap-gestes-urgence", title: "Fiche gestes d'urgence", description: "Procédures en cas d'accident ou de malaise à domicile.", category: "safety", isMandatory: true, action: "generate" },
  ],
  regulations: [
    { code: "CASF", label: "Code de l'action sociale et des familles", description: "Cadre légal des services à la personne, agrément qualité." },
    { code: "Conv-BAD", label: "Convention collective BAD", description: "Convention nationale des structures de l'aide à domicile (IDCC 2941)." },
    { code: "Art.L133-6", label: "Art. L133-6 CASF — Casier judiciaire", description: "Obligation de vérification B3 pour travailler avec des mineurs ou des personnes vulnérables." },
    { code: "NF X50-058", label: "Norme NF SAP", description: "Certification qualité des services à la personne (anciennement label NF)." },
    { code: "RGPD-SAP", label: "RGPD — données de santé", description: "Traitement des données personnelles et de santé des bénéficiaires." },
  ],
  procedures: [
    { id: "sap-remplacement", trigger: "Absence d'un intervenant", title: "Procédure remplacement urgent", steps: ["Identifier les intervenants disponibles sur la zone", "Vérifier les compétences requises", "Contacter l'intervenant remplaçant", "Informer le bénéficiaire et/ou la famille", "Mettre à jour le planning", "Saisir le remplacement dans Nexo"] },
    { id: "sap-signalement", trigger: "Situation à risque chez un bénéficiaire", title: "Procédure signalement", steps: ["L'intervenant remonte l'alerte au coordinateur", "Évaluation de la situation sous 2h", "Contact avec la famille ou le médecin traitant", "Décision : maintien, adaptation ou signalement MDPH/ARS", "Traçabilité dans le dossier bénéficiaire"] },
  ],
  marketing: {
    headline: "L'onboarding de vos intervenants, enfin aussi soigné que vos bénéficiaires.",
    subheadline: "Dossiers complets, tournées couvertes, familles rassurées.",
    description: "Nexo centralise le dossier de chaque intervenant, automatise les alertes de renouvellement (PSC1, permis, aptitude) et vous alerte en temps réel sur les remplacements urgents.",
    painPoints: [
      { icon: "AlertTriangle", title: "Habilitations expirées non détectées", description: "Un intervenant envoie sur le terrain sans PSC1 valide : le risque juridique est immédiat." },
      { icon: "FileX", title: "Dossiers incomplets", description: "Casier judiciaire manquant, visite médicale dépassée : l'agrément est en jeu." },
      { icon: "Clock", title: "Remplacements en urgence", description: "Trouver un remplaçant disponible et qualifié en moins d'une heure, sans outil centralisé." },
    ],
    benefits: [
      { icon: "ShieldCheck", title: "Conformité en temps réel", description: "Alertes automatiques avant expiration de chaque certification." },
      { icon: "Users", title: "Remplacements simplifiés", description: "Identifiez immédiatement les intervenants disponibles et qualifiés sur votre zone." },
      { icon: "Heart", title: "Suivi bénéficiaire", description: "Reliez chaque intervenant à ses bénéficiaires pour un suivi de qualité." },
    ],
    stats: [{ value: "85%", label: "des SAAD citent la gestion RH comme principal frein à la croissance" }, { value: "23 min", label: "économisées par recrutement avec un dossier numérique complet" }, { value: "40%", label: "de réduction du turnover avec un onboarding structuré" }],
    cta: "Structurer mes intervenants",
    ctaSecondary: "Voir une démo SAP",
    seoTitle: "Logiciel RH Services à la personne — Nexo RH",
    seoDescription: "Gérez les dossiers intervenants, habilitations, remplacements et planning avec Nexo. Conforme CASF, BAD. Essai gratuit 14 jours.",
    keywords: ["logiciel rh services à la personne", "gestion intervenants domicile", "onboarding aide à domicile", "habilitations SAP", "conformité CASF"],
  },
  brevo: { listId: 2, segmentTag: "sap" },
};

// =============================================================================
// 2. INDUSTRIE & BTP
// =============================================================================
const btp: SectorConfig = {
  id: "btp",
  slug: "industrie-btp",
  label: "Industrie & BTP",
  emoji: "🏗️",
  tagline: "Habilitations à jour, chantiers sécurisés, compagnons opérationnels.",
  colors: {
    primary: "#F59E0B",
    secondary: "#FEF3C7",
    accent: "#1E3A5F",
    tw: {
      bg: "bg-amber-500",
      bgLight: "bg-amber-50",
      text: "text-amber-500",
      textDark: "text-amber-700",
      border: "border-amber-200",
      ring: "ring-amber-500",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
    },
  },
  labels: {
    member: "compagnon",
    memberPlural: "compagnons",
    memberFeminine: "compagnonne",
    team: "chantier",
    teamPlural: "chantiers",
    onboarding: "Accueil sécurité J1",
    arrival: "Nouvelle affectation chantier",
    manager: "chef de chantier",
    managerPlural: "chefs de chantier",
    brief: "Demande de recrutement chantier",
    pipeline: "Pipeline recrutement BTP",
  },
  jargon: {
    collaborateur: "compagnon",
    équipe: "chantier",
    onboarding: "accueil sécurité J1",
    manager: "chef de chantier",
    objectifs: "montée en autonomie chantier",
    documents: "habilitations & permis",
    "outils & accès": "équipements & EPI affectés",
    "brief RH": "demande de recrutement chantier",
    "nouvelles arrivées": "nouvelles affectations chantier",
    notes: "rapport terrain",
  },
  roles: [
    { key: "hr_director", label: "DRH / Responsable RH", labelFeminine: "DRH / Responsable RH", description: "Pilote le recrutement, les habilitations et la conformité HSE.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "site_manager", label: "Chef de chantier", labelFeminine: "Cheffe de chantier", description: "Encadre l'équipe sur site, vérifie les EPI et les habilitations au quotidien.", isAdmin: false, permissions: ["members:read", "members:write", "documents:read"] },
    { key: "hse_manager", label: "Responsable HSE", labelFeminine: "Responsable HSE", description: "Suit les habilitations, formations obligatoires et la conformité sécurité.", isAdmin: false, permissions: ["members:read", "documents:write", "analytics:read"] },
    { key: "operator", label: "Opérateur / Compagnon", labelFeminine: "Opératrice / Compagnonne", description: "Exécute les tâches sur chantier ou en atelier.", isAdmin: false, permissions: ["documents:read"] },
  ],
  documents: [
    { id: "btp-habilitation-elec", title: "Habilitation électrique", description: "NF C 18-510 — niveaux B0/H0 à B2V/H2V selon le poste.", category: "regulatory", isMandatory: false, action: "collect", renewalMonths: 36, regulation: "NF C 18-510" },
    { id: "btp-caces", title: "CACES (Certificat d'aptitude)", description: "Conduite engins : R482 (engins de chantier), R489 (chariots), R486 (PEMP).", category: "training", isMandatory: false, action: "collect", renewalMonths: 60, regulation: "R4323-55 CT" },
    { id: "btp-sst", title: "SST — Sauveteur Secouriste du Travail", description: "Formation secours, recyclage tous les 24 mois.", category: "training", isMandatory: false, action: "collect", renewalMonths: 24, regulation: "Art. R4224-15 CT" },
    { id: "btp-aipr", title: "AIPR — Travaux à proximité des réseaux", description: "Autorisation d'Intervention à Proximité des Réseaux.", category: "regulatory", isMandatory: false, action: "collect", renewalMonths: 60, regulation: "Décret n°2012-970" },
    { id: "btp-visite-medicale", title: "Visite médicale aptitude", description: "Médecine du travail, suivi renforcé pour postes à risques.", category: "health", isMandatory: true, action: "collect", renewalMonths: 12 },
    { id: "btp-accueil-securite", title: "Livret accueil sécurité J1", description: "Consignes chantier, EPI obligatoires, plan d'évacuation, contacts urgence.", category: "safety", isMandatory: true, action: "generate", regulation: "Art. L4141-2 CT" },
    { id: "btp-epi-remise", title: "Fiche remise des EPI", description: "Attestation de remise des équipements de protection individuelle.", category: "equipment", isMandatory: true, action: "sign", regulation: "Art. R4323-95 CT" },
    { id: "btp-ppsps", title: "PPSPS / Plan de prévention", description: "Plan Particulier de Sécurité et de Protection de la Santé.", category: "safety", isMandatory: false, action: "collect" },
    { id: "btp-permis-travail", title: "Permis feu / travail en hauteur", description: "Autorisation de travaux à risques spécifiques.", category: "regulatory", isMandatory: false, action: "generate", renewalMonths: 12 },
    { id: "btp-formations", title: "Attestations formations obligatoires", description: "Formation risques chimiques, amiante, travail en hauteur selon poste.", category: "training", isMandatory: false, action: "collect" },
  ],
  regulations: [
    { code: "Art.L4121-1", label: "Art. L4121-1 CT — Obligation sécurité", description: "L'employeur prend les mesures nécessaires pour assurer la sécurité et protéger la santé physique et mentale des travailleurs." },
    { code: "NFC18-510", label: "NF C 18-510 — Habilitations électriques", description: "Norme définissant les niveaux d'habilitation électrique et les exigences de formation." },
    { code: "R4323-55", label: "Art. R4323-55 CT — CACES", description: "Obligation de formation et autorisation de conduite pour engins de manutention et chantier." },
    { code: "Conv-BTP", label: "Convention collective BTP", description: "Accord national de la construction (IDCC 1597 gros œuvre, 1596 TP)." },
    { code: "ProBTP", label: "Caisse Pro BTP", description: "Organisme paritaire gérant retraite, prévoyance et formation du secteur BTP." },
  ],
  procedures: [
    { id: "btp-accueil-j1", trigger: "Arrivée d'un nouveau compagnon sur chantier", title: "Accueil sécurité J1 chantier", steps: ["Remettre et faire signer le livret accueil sécurité", "Vérifier habilitations et aptitude médicale en cours de validité", "Remettre les EPI et faire signer la fiche de remise", "Présenter le plan d'évacuation et les points de rassemblement", "Affecter un compagnon tuteur pour la première semaine", "Valider dans Nexo : accueil J1 complété"] },
    { id: "btp-habiliation-expiry", trigger: "Alerte habilitation expirant dans 30 jours", title: "Renouvellement habilitation", steps: ["Nexo envoie alerte automatique au responsable HSE", "Vérifier la disponibilité du compagnon pour la formation", "Inscrire à la session de renouvellement (organisme agréé)", "Mettre à jour la date d'expiration dans Nexo après la formation"] },
  ],
  marketing: {
    headline: "Zéro habilitation expirée. Zéro chantier à l'arrêt.",
    subheadline: "Gérez les CACES, habilitations électriques, SST et EPI d'un seul tableau de bord.",
    description: "Nexo centralise tous les documents réglementaires de vos compagnons, vous alerte 30 jours avant chaque expiration et sécurise l'accueil chantier dès le J1.",
    painPoints: [
      { icon: "ShieldAlert", title: "Habilitation expirée non détectée", description: "Un compagnon sans CACES valide sur un engin : arrêt de chantier, mise en demeure DREAL." },
      { icon: "FileWarning", title: "Accueil sécurité incomplet", description: "Accident sans livret signé = responsabilité pénale de l'employeur engagée." },
      { icon: "Clipboard", title: "Dossiers éparpillés", description: "Habilitations dans des classeurs, EPI sur des feuilles Excel, aptitudes médicales en retard." },
    ],
    benefits: [
      { icon: "Bell", title: "Alertes 30j avant expiration", description: "CACES, habilitations électriques, SST, aptitude médicale : plus rien ne passe entre les mailles." },
      { icon: "ClipboardCheck", title: "Accueil J1 traçable", description: "Livret sécurité, remise EPI et signature numérique — conformité juridique immédiate." },
      { icon: "BarChart3", title: "Tableau de bord conformité", description: "Vision temps réel du taux de conformité par chantier et par profil réglementaire." },
    ],
    stats: [{ value: "1/3", label: "des accidents du travail en BTP liés à un défaut de formation ou d'habilitation" }, { value: "50k€", label: "amende maximale pour défaut d'aptitude médicale" }, { value: "72h", label: "délai moyen de mise à jour des dossiers avec Nexo vs 2 semaines en manuel" }],
    cta: "Sécuriser mes chantiers",
    ctaSecondary: "Voir une démo BTP",
    seoTitle: "Logiciel RH BTP — Habilitations, CACES, sécurité chantier — Nexo",
    seoDescription: "Gérez habilitations électriques, CACES, EPI et accueil sécurité J1 avec Nexo. Alertes automatiques avant expiration. Essai 14 jours.",
    keywords: ["logiciel rh btp", "gestion habilitations chantier", "onboarding btp", "caces gestion", "conformité sécurité construction"],
  },
  brevo: { listId: 3, segmentTag: "btp" },
};

// =============================================================================
// 3. SANTÉ & MÉDICO-SOCIAL
// =============================================================================
const sante: SectorConfig = {
  id: "sante",
  slug: "sante-medico-social",
  label: "Santé & médico-social",
  emoji: "🏥",
  tagline: "Dossiers professionnels conformes, équipes sereinement planifiées.",
  colors: {
    primary: "#0EA5E9",
    secondary: "#E0F2FE",
    accent: "#0284C7",
    tw: {
      bg: "bg-sky-500",
      bgLight: "bg-sky-50",
      text: "text-sky-500",
      textDark: "text-sky-700",
      border: "border-sky-200",
      ring: "ring-sky-500",
      badge: "border-sky-200 bg-sky-50 text-sky-700",
    },
  },
  labels: {
    member: "soignant",
    memberPlural: "soignants",
    memberFeminine: "soignante",
    team: "service",
    teamPlural: "services",
    onboarding: "Intégration professionnelle",
    arrival: "Nouvelle affectation service",
    manager: "cadre de santé",
    managerPlural: "cadres de santé",
    brief: "Demande de recrutement service",
    pipeline: "Pipeline soignants",
  },
  jargon: {
    collaborateur: "praticien / soignant",
    équipe: "service",
    onboarding: "intégration professionnelle",
    manager: "cadre de santé",
    objectifs: "suivi période d'intégration service",
    documents: "dossier professionnel",
    "outils & accès": "autorisations d'exercice & protocoles",
    "brief RH": "demande de recrutement service",
    "nouvelles arrivées": "nouvelles affectations service",
    notes: "transmission / compte-rendu de service",
  },
  roles: [
    { key: "hr_director", label: "DRH / Directeur des soins", labelFeminine: "DRH / Directrice des soins", description: "Pilote recrutement, conformité et organisation du personnel soignant.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "nursing_manager", label: "Cadre de santé", labelFeminine: "Cadre de santé", description: "Encadre une équipe soignante, gère les plannings et les compétences.", isAdmin: false, permissions: ["members:read", "members:write", "documents:read", "analytics:read"] },
    { key: "practitioner", label: "Praticien / Soignant", labelFeminine: "Praticienne / Soignante", description: "Professionnel de santé diplômé d'État (IDE, AS, médecin, kiné…).", isAdmin: false, permissions: ["documents:read"] },
    { key: "medical_secretary", label: "Secrétaire médical", labelFeminine: "Secrétaire médicale", description: "Gestion administrative des dossiers et accueil patient.", isAdmin: false, permissions: ["documents:read"] },
  ],
  documents: [
    { id: "sante-rpps", title: "Numéro RPPS", description: "Répertoire Partagé des Professionnels de Santé — identifiant national obligatoire.", category: "regulatory", isMandatory: true, action: "collect", regulation: "Art. R4121-1 CSP" },
    { id: "sante-diplome-etat", title: "Diplôme d'État", description: "Copie certifiée conforme du DE (IDE, AS, IADE, IBODE, Médecin, Kiné…).", category: "administrative", isMandatory: true, action: "collect" },
    { id: "sante-ordres", title: "Inscription à l'Ordre professionnel", description: "Attestation d'inscription en cours de validité (Ordre infirmiers, médecins…).", category: "regulatory", isMandatory: true, action: "collect", renewalMonths: 12, regulation: "Art. L4112-1 CSP" },
    { id: "sante-vaccinations", title: "Carnet vaccinal — Vaccinations obligatoires", description: "Hépatite B, DTP, grippe saisonnière selon poste.", category: "health", isMandatory: true, action: "collect", regulation: "Art. L3111-4 CSP" },
    { id: "sante-aptitude", title: "Fiche d'aptitude médicale au poste", description: "Médecine préventive, visite d'aptitude initiale puis annuelle.", category: "health", isMandatory: true, action: "collect", renewalMonths: 12 },
    { id: "sante-autorisation-exercice", title: "Autorisation d'exercice (hors UE)", description: "Dérogation / autorisation ARS pour les diplômés étrangers.", category: "regulatory", isMandatory: false, action: "collect", regulation: "Art. L4111-2 CSP" },
    { id: "sante-protocoles", title: "Prise de connaissance protocoles internes", description: "Signature attestant la lecture des protocoles de soins, urgences et hygiène.", category: "hr", isMandatory: true, action: "sign" },
    { id: "sante-rgpd-sante", title: "Engagement confidentialité données de santé", description: "RGPD santé — accès aux données patients et obligations de confidentialité.", category: "hr", isMandatory: true, action: "sign", regulation: "RGPD Art. 9" },
    { id: "sante-roulements", title: "Planning roulements & astreintes", description: "Cycle de travail, astreintes sur appel, gardes.", category: "hr", isMandatory: true, action: "generate" },
  ],
  regulations: [
    { code: "CSP-L4311", label: "Art. L4311-1 CSP — Exercice infirmier", description: "Définition des actes infirmiers et conditions légales d'exercice." },
    { code: "CSP-L3111", label: "Art. L3111-4 CSP — Vaccinations obligatoires", description: "Obligation vaccinale pour les professionnels de santé (HBV, DTP, grippe)." },
    { code: "RGPD-Art9", label: "RGPD Art. 9 — Données de santé", description: "Traitement licite des données de santé, obligations de confidentialité et sécurité." },
    { code: "Conv-FHP", label: "Convention collective FHP", description: "Convention de la Fédération de l'Hospitalisation Privée (IDCC 0029)." },
    { code: "Conv-FEHAP", label: "Convention collective FEHAP (51)", description: "Établissements privés non lucratifs sanitaires et sociaux." },
  ],
  procedures: [
    { id: "sante-accueil-service", trigger: "Arrivée d'un nouveau soignant", title: "Intégration service de soins", steps: ["Vérifier RPPS, inscription Ordre et vaccinations", "Remettre les codes d'accès au dossier patient informatisé (DPI)", "Présenter les protocoles de soins et d'urgence", "Affecter un tuteur / référent pour les 15 premiers jours", "Planifier une évaluation à 3 mois", "Valider dans Nexo : intégration professionnelle complète"] },
    { id: "sante-vaccination", trigger: "Vaccination expirante", title: "Rappel vaccination obligatoire", steps: ["Nexo alerte 30j avant expiration", "Rappel au soignant via notification", "Vérification de la mise à jour auprès de la médecine du travail", "Upload du nouveau carnet vaccinal dans Nexo"] },
  ],
  marketing: {
    headline: "Le dossier professionnel de vos soignants, conforme sans effort.",
    subheadline: "RPPS, Ordres, vaccinations, habilitations — tout centralisé, rien d'expiré.",
    description: "Nexo gère le dossier de chaque soignant avec les exigences spécifiques du secteur : vaccinations obligatoires, inscriptions aux Ordres, autorisation d'exercice et protocoles internes.",
    painPoints: [
      { icon: "FileWarning", title: "Vaccination HBV expirée non détectée", description: "Un soignant sans vaccination à jour : risque médico-légal et obligation d'écarter du poste." },
      { icon: "AlertCircle", title: "Inscription Ordre non vérifiée", description: "Un professionnel sans inscription active à l'Ordre ne peut légalement pas exercer." },
      { icon: "Clock", title: "Astreintes mal planifiées", description: "Roulements non optimisés, remplacements de dernière minute, épuisement de l'équipe." },
    ],
    benefits: [
      { icon: "ShieldCheck", title: "Conformité réglementaire automatique", description: "Alertes avant expiration RPPS, Ordres, vaccinations, aptitude médicale." },
      { icon: "Calendar", title: "Roulements et astreintes clairs", description: "Planning structuré, visualisation des contraintes, gestion des gardes." },
      { icon: "Lock", title: "RGPD santé respecté", description: "Engagement de confidentialité signé, accès tracé aux données patients." },
    ],
    stats: [{ value: "62%", label: "des DRH santé déclarent passer plus de 5h/semaine sur la conformité documentaire" }, { value: "2 800€", label: "coût moyen d'un recrutement infirmier vs 0 si le dossier est prêt à l'intégration" }, { value: "90 jours", label: "délai moyen de prise en autonomie — réduit à 60 avec un parcours structuré" }],
    cta: "Structurer mes équipes soignantes",
    ctaSecondary: "Voir une démo Santé",
    seoTitle: "Logiciel RH Santé & médico-social — Nexo RH",
    seoDescription: "Gérez RPPS, Ordres, vaccinations et dossiers soignants avec Nexo. Alertes automatiques, conformité CSP. Essai 14 jours.",
    keywords: ["logiciel rh santé", "gestion dossiers soignants", "onboarding infirmier", "conformité hôpital", "rpps ordre médecin"],
  },
  brevo: { listId: 4, segmentTag: "sante" },
};

// =============================================================================
// 4. COMMERCE & DISTRIBUTION
// =============================================================================
const commerce: SectorConfig = {
  id: "commerce",
  slug: "commerce-distribution",
  label: "Commerce & distribution",
  emoji: "🛒",
  tagline: "Onboardez vite, fidélisez dès le premier jour.",
  colors: {
    primary: "#EF4444",
    secondary: "#FEE2E2",
    accent: "#DC2626",
    tw: { bg: "bg-red-500", bgLight: "bg-red-50", text: "text-red-500", textDark: "text-red-700", border: "border-red-200", ring: "ring-red-500", badge: "border-red-200 bg-red-50 text-red-700" },
  },
  labels: {
    member: "vendeur",
    memberPlural: "vendeurs",
    memberFeminine: "vendeuse",
    team: "magasin",
    teamPlural: "magasins",
    onboarding: "Parcours vendeur",
    arrival: "Nouvelle affectation magasin",
    manager: "responsable de magasin",
    managerPlural: "responsables de magasin",
    brief: "Demande de recrutement magasin",
    pipeline: "Pipeline recrutement points de vente",
  },
  jargon: {
    collaborateur: "vendeur / hôte de caisse",
    équipe: "magasin",
    onboarding: "parcours vendeur",
    manager: "responsable de magasin",
    objectifs: "objectifs commerciaux & période d'essai",
    documents: "tenues, badges & accès magasin",
    "outils & accès": "formation caisse & outils PLV",
    "brief RH": "demande de recrutement magasin",
    "nouvelles arrivées": "nouvelles affectations magasin",
    notes: "debriefs manager",
  },
  roles: [
    { key: "hr_director", label: "DRH Réseau", labelFeminine: "DRH Réseau", description: "Pilote le recrutement et l'intégration sur l'ensemble des points de vente.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "store_manager", label: "Responsable de magasin", labelFeminine: "Responsable de magasin", description: "Gère l'équipe du point de vente, planning et formation terrain.", isAdmin: false, permissions: ["members:read", "members:write", "documents:read", "analytics:read"] },
    { key: "department_manager", label: "Chef de rayon", labelFeminine: "Cheffe de rayon", description: "Anime son périmètre et encadre les vendeurs de son rayon.", isAdmin: false, permissions: ["members:read", "documents:read"] },
    { key: "sales_rep", label: "Vendeur / Hôte de caisse", labelFeminine: "Vendeuse / Hôtesse de caisse", description: "Assure la vente et le conseil client en magasin.", isAdmin: false, permissions: ["documents:read"] },
  ],
  documents: [
    { id: "com-badge", title: "Badge et tenue de travail", description: "Remise du badge d'accès et des éléments de tenue (uniforme, gilet, badge nominatif).", category: "equipment", isMandatory: true, action: "sign" },
    { id: "com-formation-caisse", title: "Attestation formation caisse", description: "Formation logiciel de caisse et procédures d'encaissement.", category: "training", isMandatory: true, action: "sign" },
    { id: "com-reglement-interieur", title: "Règlement intérieur magasin", description: "Règles de conduite, politique de remises, gestion des retours.", category: "hr", isMandatory: true, action: "sign" },
    { id: "com-pe", title: "Objectifs période d'essai", description: "Objectifs commerciaux et critères d'évaluation sur la période d'essai.", category: "hr", isMandatory: true, action: "generate" },
    { id: "com-anti-vol", title: "Procédures anti-démarque inconnue", description: "Formation surveillance, gestion des incidents et procédure EAS.", category: "training", isMandatory: true, action: "sign" },
    { id: "com-rgpd-client", title: "Formation RGPD données clients", description: "Collecte et traitement des données clients (carte fidélité, email…).", category: "regulatory", isMandatory: true, action: "sign", regulation: "RGPD Art. 6" },
    { id: "com-sst", title: "SST — Premiers secours", description: "Formation secouriste en entreprise, renouvellement 24 mois.", category: "training", isMandatory: false, action: "collect", renewalMonths: 24 },
  ],
  regulations: [
    { code: "Conv-Commerce", label: "Convention collective Commerce de détail", description: "Accord national du commerce de détail (IDCC 0573 alimentation, 1411 non alimentaire)." },
    { code: "RGPD-Clients", label: "RGPD — Données clients", description: "Collecte données de fidélité, consentement email, droit à l'oubli." },
    { code: "CPF-Formation", label: "Compte Personnel de Formation", description: "Obligation de formation, entretien professionnel tous les 2 ans." },
  ],
  procedures: [
    { id: "com-accueil-j1", trigger: "Arrivée nouveau vendeur", title: "Parcours vendeur J1–J7", steps: ["Remettre badge, tenue et code d'accès", "Formation caisse (1/2 journée avec tuteur)", "Présentation rayon et procédures magasin", "Signature règlement intérieur et procédures anti-démarque", "Définir les objectifs de la période d'essai", "Point quotidien J1–J5 avec chef de rayon"] },
  ],
  marketing: {
    headline: "De 0 à opérationnel en magasin en moins de 48h.",
    subheadline: "Badge, formation caisse, objectifs PE — tout prêt avant le premier shift.",
    description: "Nexo structure l'intégration de chaque vendeur, du badge à la signature du règlement intérieur, avec des alertes sur les fins de période d'essai et les remplacements de shifts.",
    painPoints: [
      { icon: "Users", title: "Turnover record non maîtrisé", description: "Sans onboarding structuré, 40% des nouveaux recrutements quittent dans les 90 jours." },
      { icon: "Clock", title: "Formation caisse improvisée", description: "Chaque manager forme à sa façon : erreurs de caisse, écarts de stock, incidents clients." },
      { icon: "Calendar", title: "Shifts non couverts", description: "Absences de dernière minute sans outil de gestion des remplacements." },
    ],
    benefits: [
      { icon: "Zap", title: "Opérationnel en 48h", description: "Parcours vendeur standardisé : badge, caisse, rayon — checklist validée en 2 jours." },
      { icon: "TrendingDown", title: "Turnover réduit", description: "Un onboarding soigné multiplie par 2 la rétention à 90 jours." },
      { icon: "Bell", title: "Fin de PE automatique", description: "Alertes à J-7 de la fin de période d'essai pour ne jamais rater une décision." },
    ],
    stats: [{ value: "47%", label: "du turnover en commerce survient dans les 6 premiers mois" }, { value: "3 500€", label: "coût moyen d'un recrutement vendeur, renouvellement inclus" }, { value: "48h", label: "délai d'autonomie caisse avec un parcours Nexo structuré" }],
    cta: "Structurer mes recrutements magasin",
    ctaSecondary: "Voir une démo Commerce",
    seoTitle: "Logiciel RH Commerce & distribution — Nexo RH",
    seoDescription: "Onboarding vendeurs, formation caisse, gestion PE et shifts avec Nexo. Réduisez le turnover. Essai gratuit 14 jours.",
    keywords: ["logiciel rh commerce", "onboarding vendeur", "gestion magasin rh", "période essai commerce", "turnover distribution"],
  },
  brevo: { listId: 5, segmentTag: "commerce" },
};

// =============================================================================
// 5. ASSOCIATIONS
// =============================================================================
const associations: SectorConfig = {
  id: "asso",
  slug: "associations",
  label: "Associations",
  emoji: "🤝",
  tagline: "Salariés et bénévoles : une seule plateforme, zéro friction.",
  colors: {
    primary: "#8B5CF6",
    secondary: "#EDE9FE",
    accent: "#7C3AED",
    tw: { bg: "bg-violet-500", bgLight: "bg-violet-50", text: "text-violet-500", textDark: "text-violet-700", border: "border-violet-200", ring: "ring-violet-500", badge: "border-violet-200 bg-violet-50 text-violet-700" },
  },
  labels: {
    member: "salarié / bénévole",
    memberPlural: "membres",
    memberFeminine: "salariée / bénévole",
    team: "mission",
    teamPlural: "missions",
    onboarding: "Parcours d'accueil",
    arrival: "Nouvel·le engagé·e",
    manager: "responsable de mission",
    managerPlural: "responsables de mission",
    brief: "Appel à bénévoles / ouverture de poste",
    pipeline: "Recrutement salariés & bénévoles",
  },
  jargon: {
    collaborateur: "salarié / bénévole",
    équipe: "mission",
    onboarding: "parcours d'accueil",
    manager: "responsable de mission",
    objectifs: "suivi engagement & montée en mission",
    documents: "documents administratifs & conventions",
    "outils & accès": "formations internes & référents mission",
    "brief RH": "appel à bénévoles / ouverture de poste",
    "nouvelles arrivées": "nouveaux engagés · nouvelles affectations missions",
    notes: "compte-rendu mission",
  },
  roles: [
    { key: "director", label: "Directeur·trice", labelFeminine: "Directrice", description: "Dirige l'association, valide les recrutements et supervise les équipes.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "hr_manager", label: "Responsable RH / Bénévolat", labelFeminine: "Responsable RH / Bénévolat", description: "Gère les recrutements, conventions de bénévolat et suivi des membres.", isAdmin: false, permissions: ["members:write", "documents:write", "analytics:read"] },
    { key: "mission_manager", label: "Responsable de mission", labelFeminine: "Responsable de mission", description: "Encadre les bénévoles et salariés affectés à une mission ou un pôle.", isAdmin: false, permissions: ["members:read", "documents:read"] },
    { key: "employee", label: "Salarié·e", labelFeminine: "Salariée", description: "Travaille en CDI, CDD ou en alternance au sein de l'association.", isAdmin: false, permissions: ["documents:read"] },
    { key: "volunteer", label: "Bénévole", labelFeminine: "Bénévole", description: "S'engage sur une mission sans lien de subordination ni rémunération.", isAdmin: false, permissions: ["documents:read"] },
  ],
  documents: [
    { id: "asso-convention-benevolat", title: "Convention de bénévolat", description: "Document encadrant l'engagement du bénévole (missions, durée, responsabilités).", category: "hr", isMandatory: true, action: "sign" },
    { id: "asso-assurance", title: "Attestation assurance RC association", description: "Couverture du bénévole pendant ses missions.", category: "regulatory", isMandatory: true, action: "generate", renewalMonths: 12 },
    { id: "asso-cni", title: "Pièce d'identité", description: "CNI ou passeport du bénévole / salarié.", category: "administrative", isMandatory: true, action: "collect" },
    { id: "asso-conges-benevoles", title: "Information droit au congé bénévole", description: "Information sur le droit à 6 jours de congé pour les bénévoles d'associations reconnues d'utilité publique.", category: "regulatory", isMandatory: false, action: "generate", regulation: "Loi 2017-86 ESS" },
    { id: "asso-rgpd", title: "Engagement RGPD membres", description: "Traitement des données personnelles des bénéficiaires et membres.", category: "regulatory", isMandatory: true, action: "sign" },
    { id: "asso-formations", title: "Attestations formations internes", description: "Formation aux missions, outils et procédures internes de l'association.", category: "training", isMandatory: false, action: "collect" },
    { id: "asso-compte-rendu", title: "Charte de compte-rendu de mission", description: "Modèle de rapport de mission et fréquence attendue.", category: "hr", isMandatory: false, action: "generate" },
  ],
  regulations: [
    { code: "Loi1901", label: "Loi du 1er juillet 1901 — Associations", description: "Cadre légal des associations loi 1901 : objet social, membres, fonctionnement." },
    { code: "Conv-Asso", label: "Convention collective associative (IDCC 1518)", description: "Accord de branche des associations, fondations et organismes du secteur associatif." },
    { code: "ESS-2017-86", label: "Loi ESS — Congé bénévole", description: "Droit à 6 jours de congé/an pour engagement associatif (art. L3142-54 CT)." },
    { code: "DUE-Assoc", label: "Déclaration Unique d'Embauche", description: "Formalité obligatoire à l'embauche de tout salarié." },
  ],
  procedures: [
    { id: "asso-accueil-benevole", trigger: "Arrivée d'un nouveau bénévole", title: "Intégration bénévole", steps: ["Signer la convention de bénévolat", "Remettre l'attestation d'assurance RC", "Présenter les missions et affecter un référent", "Formation aux outils et procédures internes", "Planifier un point de suivi à 30 jours", "Valider dans Nexo : accueil bénévole complété"] },
  ],
  marketing: {
    headline: "Gérez salariés et bénévoles sans jongler entre deux outils.",
    subheadline: "Conventions de bénévolat, missions, disponibilités — tout en un.",
    description: "Nexo adapte chaque parcours au profil : salarié en CDI ou bénévole ponctuel. Conventions signées, assurance à jour, missions suivies — votre association reste conforme et agile.",
    painPoints: [
      { icon: "FileX", title: "Conventions de bénévolat non signées", description: "Sans convention signée, la responsabilité de l'association est engagée en cas d'accident." },
      { icon: "UserMinus", title: "Désengagement silencieux", description: "Les bénévoles partent sans prévenir faute de suivi. La mission n'est plus couverte." },
      { icon: "Shuffle", title: "Double gestion salariés / bénévoles", description: "Deux tableurs, deux processus, deux façons de faire RH dans la même structure." },
    ],
    benefits: [
      { icon: "Users", title: "Double profil natif", description: "Un seul outil pour vos salariés et vos bénévoles, avec des parcours différenciés." },
      { icon: "FileCheck", title: "Conventions signées automatiquement", description: "Générez et faites signer les conventions de bénévolat en quelques clics." },
      { icon: "TrendingUp", title: "Suivi de l'engagement", description: "Visualisez les missions actives, les disponibilités et la fidélité de vos bénévoles." },
    ],
    stats: [{ value: "1,8M", label: "associations en France, dont 165 000 avec des salariés" }, { value: "35%", label: "des bénévoles se désengagent faute de suivi dans la première année" }, { value: "72%", label: "des associations gèrent encore leurs bénévoles avec Excel" }],
    cta: "Structurer mon association",
    ctaSecondary: "Voir une démo Associations",
    seoTitle: "Logiciel RH Associations — Salariés & Bénévoles — Nexo",
    seoDescription: "Gérez salariés et bénévoles avec Nexo : conventions, missions, disponibilités. Conforme loi 1901. Essai 14 jours.",
    keywords: ["logiciel rh association", "gestion bénévoles", "convention bénévolat", "onboarding association", "suivi missions"],
  },
  brevo: { listId: 6, segmentTag: "asso" },
};

// =============================================================================
// 6. HÔTELLERIE & RESTAURATION
// =============================================================================
const hotellerie: SectorConfig = {
  id: "hotel",
  slug: "hotellerie-restauration",
  label: "Hôtellerie & restauration",
  emoji: "🍽️",
  tagline: "Shifts couverts, équipes formées, tenues prêtes avant le premier service.",
  colors: {
    primary: "#D97706",
    secondary: "#FEF3C7",
    accent: "#B45309",
    tw: { bg: "bg-amber-600", bgLight: "bg-amber-50", text: "text-amber-600", textDark: "text-amber-800", border: "border-amber-200", ring: "ring-amber-600", badge: "border-amber-200 bg-amber-50 text-amber-800" },
  },
  labels: {
    member: "collaborateur de service",
    memberPlural: "collaborateurs de service",
    memberFeminine: "collaboratrice de service",
    team: "service",
    teamPlural: "services",
    onboarding: "Accueil J1 en établissement",
    arrival: "Nouvelle arrivée saison",
    manager: "chef de service",
    managerPlural: "chefs de service",
    brief: "Demande saisonnier / extra",
    pipeline: "Pipeline recrutement saisonnier & CDI",
  },
  jargon: {
    collaborateur: "serveur / cuisinier / réceptionniste",
    équipe: "service",
    onboarding: "accueil J1 en établissement",
    manager: "chef de service",
    objectifs: "suivi des essais & premières semaines",
    documents: "tenues, badges · attestation HACCP",
    "outils & accès": "affectation service & formation hygiène",
    "brief RH": "demande saisonnier / extra",
    "nouvelles arrivées": "nouvelles arrivées saison · extras du jour",
    notes: "debriefs chef de service",
  },
  roles: [
    { key: "hr_director", label: "DRH / Directeur d'hôtel", labelFeminine: "DRH / Directrice d'hôtel", description: "Pilote recrutement saisonnier, conformité hygiène et gestion RH établissement.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "service_manager", label: "Chef de service", labelFeminine: "Cheffe de service", description: "Encadre son équipe (cuisine, salle, hébergement), gère les shifts.", isAdmin: false, permissions: ["members:read", "members:write", "documents:read"] },
    { key: "staff", label: "Personnel de service", labelFeminine: "Personnelle de service", description: "Serveur, cuisinier, réceptionniste, femme de chambre.", isAdmin: false, permissions: ["documents:read"] },
    { key: "seasonal", label: "Saisonnier / Extra", labelFeminine: "Saisonnière / Extra", description: "Renfort sur une saison ou un événement ponctuel.", isAdmin: false, permissions: ["documents:read"] },
  ],
  documents: [
    { id: "hotel-haccp", title: "Attestation formation hygiène HACCP", description: "Formation hygiène alimentaire 14h obligatoire pour les responsables d'établissements de restauration commerciale.", category: "training", isMandatory: true, action: "collect", regulation: "Arrêté 5 octobre 2011" },
    { id: "hotel-tenue", title: "Remise tenue et badge", description: "Uniforme, badge nominatif, équipements de service remis à l'arrivée.", category: "equipment", isMandatory: true, action: "sign" },
    { id: "hotel-contrat-saisonnier", title: "Contrat saisonnier / extra", description: "CDDS ou CDI Saisonnier selon convention HCR.", category: "administrative", isMandatory: true, action: "sign", regulation: "Art. L1244-2 CT" },
    { id: "hotel-casier", title: "Extrait casier judiciaire B3", description: "Obligatoire pour les postes en contact avec des mineurs (certains hôtels / clubs).", category: "regulatory", isMandatory: false, action: "collect" },
    { id: "hotel-alcool", title: "Attestation permis de vente alcool", description: "Formation vente d'alcool — obligatoire pour les responsables de débit.", category: "training", isMandatory: false, action: "collect", regulation: "Art. L3331-4 CSP" },
    { id: "hotel-allergenes", title: "Formation allergènes alimentaires", description: "Connaissance des 14 allergènes majeurs et procédures d'information client.", category: "training", isMandatory: true, action: "sign", regulation: "Règl. UE 1169/2011" },
    { id: "hotel-planning", title: "Planning shifts saison", description: "Répartition des shifts, jours de repos, heures supplémentaires prévisionnelles.", category: "hr", isMandatory: true, action: "generate" },
  ],
  regulations: [
    { code: "Conv-HCR", label: "Convention collective HCR (IDCC 1979)", description: "Convention de l'hôtellerie, restauration et industries touristiques." },
    { code: "HACCP", label: "HACCP — Hygiène alimentaire", description: "Arrêté du 5 oct. 2011 : formation hygiène obligatoire pour les responsables d'établissements de restauration commerciale." },
    { code: "UE1169-2011", label: "Règlement UE 1169/2011 — Allergènes", description: "Information obligatoire sur les 14 allergènes majeurs en restauration." },
    { code: "Art.L3331", label: "Art. L3331-4 CSP — Vente alcool", description: "Permis d'exploitation et formation obligatoire pour les débits de boissons." },
  ],
  procedures: [
    { id: "hotel-accueil-j1", trigger: "Arrivée saisonnier ou extra", title: "Accueil J1 restauration / hôtel", steps: ["Remettre tenue et badge signés", "Formation hygiène HACCP (ou vérifier attestation)", "Formation allergènes et procédures de service", "Présenter l'équipe et l'établissement", "Affecter un tuteur pour la première semaine", "Valider dans Nexo : accueil J1 complété"] },
  ],
  marketing: {
    headline: "Saisonnier arrivé le matin, opérationnel pour le service du soir.",
    subheadline: "Tenue, HACCP, allergènes, shifts — structurez l'accueil de chaque arrivée.",
    description: "Nexo gère l'afflux de saisonniers et d'extras avec des check-lists d'arrivée standardisées, les formations hygiène et les plannings de service — même en haute saison.",
    painPoints: [
      { icon: "Users", title: "Afflux saisonnier non structuré", description: "15 nouveaux arrivants en une semaine, chaque chef de service fait à sa façon." },
      { icon: "AlertTriangle", title: "HACCP non vérifié", description: "Un responsable en service sans attestation hygiène valide : fermeture administrative possible." },
      { icon: "Calendar", title: "Shifts non couverts", description: "Absences imprévues, extras non répertoriés, service en sous-effectif." },
    ],
    benefits: [
      { icon: "Zap", title: "Accueil J1 standardisé", description: "Check-list tenue, HACCP, allergènes et présentation — même quand 10 arrivent le même jour." },
      { icon: "ShieldCheck", title: "Conformité HACCP automatique", description: "Alerte si un saisonnier n'a pas d'attestation hygiène valide avant sa prise de poste." },
      { icon: "Calendar", title: "Gestion saisonniers centralisée", description: "Contrats, shifts, extras, disponibilités — une vue par établissement et par période." },
    ],
    stats: [{ value: "800 000", label: "saisonniers recrutés chaque année dans l'hôtellerie-restauration française" }, { value: "3j", label: "délai moyen d'opérationnalité d'un saisonnier non structuré (vs 1 jour avec Nexo)" }, { value: "45%", label: "des contrôles hygiène DDPP en restauration révèlent au moins un manquement documentaire" }],
    cta: "Structurer ma saison",
    ctaSecondary: "Voir une démo HCR",
    seoTitle: "Logiciel RH Hôtellerie Restauration — Saisonniers, HACCP — Nexo",
    seoDescription: "Gérez saisonniers, formation HACCP, allergènes et shifts avec Nexo. Conforme convention HCR. Essai 14 jours.",
    keywords: ["logiciel rh hôtellerie restauration", "onboarding saisonnier", "gestion haccp", "planning shifts restauration", "hcr rh"],
  },
  brevo: { listId: 7, segmentTag: "hotel" },
};

// =============================================================================
// 7. TRANSPORT & LOGISTIQUE
// =============================================================================
const transport: SectorConfig = {
  id: "transport",
  slug: "transport-logistique",
  label: "Transport & logistique",
  emoji: "🚛",
  tagline: "Permis valides, conducteurs affectés, tournées assurées.",
  colors: {
    primary: "#2563EB",
    secondary: "#DBEAFE",
    accent: "#1D4ED8",
    tw: { bg: "bg-blue-600", bgLight: "bg-blue-50", text: "text-blue-600", textDark: "text-blue-800", border: "border-blue-200", ring: "ring-blue-600", badge: "border-blue-200 bg-blue-50 text-blue-800" },
  },
  labels: {
    member: "conducteur",
    memberPlural: "conducteurs",
    memberFeminine: "conductrice",
    team: "dépôt",
    teamPlural: "dépôts",
    onboarding: "Accueil conducteur / agent logistique",
    arrival: "Nouvelle affectation dépôt",
    manager: "responsable d'exploitation",
    managerPlural: "responsables d'exploitation",
    brief: "Demande de recrutement conducteur",
    pipeline: "Pipeline conducteurs & agents",
  },
  jargon: {
    collaborateur: "conducteur / agent logistique",
    équipe: "dépôt",
    onboarding: "accueil conducteur",
    manager: "responsable d'exploitation",
    objectifs: "autonomie tournées & procédures dépôt",
    documents: "permis, FIMO/FCO, carte conducteur",
    "outils & accès": "affectation dépôt & habilitations conduite",
    "brief RH": "demande de recrutement conducteur",
    "nouvelles arrivées": "nouvelles affectations dépôt / tournée",
    notes: "rapport tournée / incident livraison",
  },
  roles: [
    { key: "hr_director", label: "DRH Transport", labelFeminine: "DRH Transport", description: "Pilote recrutement, conformité réglementaire et gestion des conducteurs.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "depot_manager", label: "Responsable de dépôt", labelFeminine: "Responsable de dépôt", description: "Gère les équipes du dépôt, planifie les tournées et vérifie les conformités.", isAdmin: false, permissions: ["members:read", "members:write", "documents:read", "analytics:read"] },
    { key: "driver", label: "Conducteur / Chauffeur", labelFeminine: "Conductrice / Chauffeuse", description: "Effectue les transports et livraisons selon les règles du CTR.", isAdmin: false, permissions: ["documents:read"] },
    { key: "logistics_agent", label: "Agent logistique", labelFeminine: "Agente logistique", description: "Gère les opérations en dépôt : préparation, chargement, inventaire.", isAdmin: false, permissions: ["documents:read"] },
  ],
  documents: [
    { id: "trans-permis-c", title: "Permis de conduire C/CE/D", description: "Catégorie correspondant aux véhicules du poste.", category: "regulatory", isMandatory: true, action: "collect", renewalMonths: 60, regulation: "Art. R221-1 CR" },
    { id: "trans-fimo", title: "FIMO — Formation Initiale Minimale Obligatoire", description: "280h obligatoires pour les nouveaux conducteurs salariés.", category: "training", isMandatory: true, action: "collect", regulation: "Dir. 2003/59/CE" },
    { id: "trans-fco", title: "FCO — Formation Continue Obligatoire", description: "35h tous les 5 ans pour maintenir les droits de conduite professionnelle.", category: "training", isMandatory: true, action: "collect", renewalMonths: 60, regulation: "Dir. 2003/59/CE" },
    { id: "trans-carte-conducteur", title: "Carte conducteur numérique", description: "Carte tachygraphe numérique, validité 5 ans.", category: "regulatory", isMandatory: true, action: "collect", renewalMonths: 60, regulation: "Règl. CE 165/2014" },
    { id: "trans-visite-medicale", title: "Aptitude médicale permis professionnel", description: "Visite médicale transport tous les 5 ans (3 ans après 60 ans).", category: "health", isMandatory: true, action: "collect", renewalMonths: 60, regulation: "Art. R221-10 CR" },
    { id: "trans-adr", title: "Certificat ADR (Matières Dangereuses)", description: "Transport marchandises dangereuses — si applicable au poste.", category: "regulatory", isMandatory: false, action: "collect", renewalMonths: 60, regulation: "ADR 2025" },
    { id: "trans-vehicule", title: "Fiche véhicule affecté", description: "Immatriculation, état, kilométrage initial, équipements embarqués.", category: "equipment", isMandatory: true, action: "generate" },
    { id: "trans-reglement", title: "Règlement intérieur transport / Code de la route professionnel", description: "Procédures temps de conduite, repos, incidents.", category: "hr", isMandatory: true, action: "sign", regulation: "Règl. CE 561/2006" },
  ],
  regulations: [
    { code: "Dir2003-59", label: "Directive 2003/59/CE — FIMO/FCO", description: "Formation initiale et continue obligatoire pour conducteurs professionnels." },
    { code: "Règl.CE561", label: "Règlement CE 561/2006 — Temps de conduite", description: "Durées maximales de conduite, temps de pause et repos obligatoires." },
    { code: "Règl.CE165", label: "Règlement CE 165/2014 — Tachygraphe", description: "Carte conducteur, tachygraphe numérique obligatoire et contrôle des données." },
    { code: "ADR2025", label: "ADR 2025 — Matières dangereuses", description: "Accord européen relatif au transport international de marchandises dangereuses par route." },
    { code: "Conv-Transport", label: "Convention collective Transport routier (IDCC 0016)", description: "Accord national des transports routiers et des activités auxiliaires du transport." },
  ],
  procedures: [
    { id: "trans-accueil-conducteur", trigger: "Arrivée d'un nouveau conducteur", title: "Accueil conducteur J1", steps: ["Vérifier permis, FIMO/FCO, carte conducteur et aptitude médicale", "Affecter le véhicule et remettre la fiche véhicule", "Formation tachygraphe numérique et procédures temps de conduite", "Présenter les tournées et le responsable de dépôt", "Signature règlement intérieur transport", "Valider dans Nexo : accueil conducteur complété"] },
    { id: "trans-fco-renewal", trigger: "FCO expirant dans 60 jours", title: "Renouvellement FCO", steps: ["Nexo envoie alerte 60j avant expiration", "Identifier les sessions FCO disponibles (OPCO Mobilités)", "Inscrire le conducteur à la formation", "Mettre à jour dans Nexo après obtention de l'attestation", "Si délai dépassé : suspendre les droits de conduite"] },
  ],
  marketing: {
    headline: "Aucun conducteur sur la route sans ses documents valides.",
    subheadline: "FIMO, FCO, carte conducteur, aptitude médicale — zéro expiration inaperçue.",
    description: "Nexo centralise le dossier réglementaire de chaque conducteur, vous alerte 60 jours avant chaque échéance et assure la traçabilité complète en cas de contrôle.",
    painPoints: [
      { icon: "AlertTriangle", title: "FCO expirée non détectée", description: "Un conducteur en infraction FIMO/FCO : immobilisation du véhicule, amende 1500€, responsabilité de l'employeur." },
      { icon: "FileWarning", title: "Contrôle DREAL impromptu", description: "Dossier incomplet lors d'un contrôle en bord de route = procès-verbal et mise en demeure." },
      { icon: "Clock", title: "Gestion des remplacements conducteurs", description: "Conducteur absent sans solution identifiée : tournée non couverte, client non livré." },
    ],
    benefits: [
      { icon: "Bell", title: "Alertes 60j avant expiration", description: "FIMO, FCO, carte conducteur, aptitude médicale : le temps de planifier la formation." },
      { icon: "ShieldCheck", title: "Prêt pour le contrôle DREAL", description: "Dossier conducteur complet exportable en PDF en 30 secondes." },
      { icon: "Truck", title: "Affectation dépôt claire", description: "Chaque conducteur rattaché à son dépôt, son véhicule et ses tournées habituelles." },
    ],
    stats: [{ value: "25 000€", label: "amende maximale pour l'employeur en cas d'infraction FIMO/FCO" }, { value: "1 contrôle/an", label: "subi en moyenne par les transporteurs routiers français" }, { value: "100%", label: "des PTI et LLD exigent la conformité documentaire avant signature contrat" }],
    cta: "Sécuriser ma flotte de conducteurs",
    ctaSecondary: "Voir une démo Transport",
    seoTitle: "Logiciel RH Transport & Logistique — FIMO FCO Conducteurs — Nexo",
    seoDescription: "Gérez FIMO, FCO, carte conducteur et aptitudes médicales avec Nexo. Alertes 60j avant expiration. Conforme CTR. Essai 14 jours.",
    keywords: ["logiciel rh transport logistique", "gestion fimo fco", "carte conducteur", "conformité transport routier", "dossier conducteur"],
  },
  brevo: { listId: 8, segmentTag: "transport" },
};

// =============================================================================
// 8. TECH & STARTUP
// =============================================================================
const tech: SectorConfig = {
  id: "tech",
  slug: "tech-startup",
  label: "Tech & startup",
  emoji: "💻",
  tagline: "Onboardez vos talents comme un produit se déploie.",
  colors: {
    primary: "#6366F1",
    secondary: "#EEF2FF",
    accent: "#4F46E5",
    tw: { bg: "bg-indigo-500", bgLight: "bg-indigo-50", text: "text-indigo-500", textDark: "text-indigo-700", border: "border-indigo-200", ring: "ring-indigo-500", badge: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  },
  labels: {
    member: "talent",
    memberPlural: "talents",
    memberFeminine: "talent",
    team: "squad",
    teamPlural: "squads",
    onboarding: "Onboarding produit",
    arrival: "Nouveau talent",
    manager: "engineering manager",
    managerPlural: "engineering managers",
    brief: "Job opening / RFC recrutement",
    pipeline: "Hiring pipeline",
  },
  jargon: {
    collaborateur: "talent / développeur / designer",
    équipe: "squad",
    onboarding: "onboarding produit",
    manager: "engineering manager",
    objectifs: "OKRs 30/60/90 jours",
    documents: "contrat, NDA, charte IT",
    "outils & accès": "setup stack SaaS",
    "brief RH": "job opening / RFC recrutement",
    "nouvelles arrivées": "nouveaux talents · buddy pairings",
    notes: "async standup · rétro onboarding",
  },
  roles: [
    { key: "head_of_people", label: "Head of People", labelFeminine: "Head of People", description: "Pilote la culture, le recrutement et l'expérience collaborateur à l'échelle.", isAdmin: true, permissions: ["members:write", "documents:write", "analytics:read", "settings:write"] },
    { key: "engineering_manager", label: "Engineering Manager", labelFeminine: "Engineering Manager", description: "Encadre une squad, définit les OKRs et assure la montée en compétences.", isAdmin: false, permissions: ["members:read", "members:write", "documents:read", "analytics:read"] },
    { key: "developer", label: "Développeur / Designer / PM", labelFeminine: "Développeuse / Designer / PM", description: "Talent en poste dans une squad produit, design ou engineering.", isAdmin: false, permissions: ["documents:read"] },
    { key: "buddy", label: "Buddy d'intégration", labelFeminine: "Buddy d'intégration", description: "Volontaire désigné pour accompagner le nouveau talent dans ses premières semaines.", isAdmin: false, permissions: ["members:read", "documents:read"] },
  ],
  documents: [
    { id: "tech-nda", title: "NDA — Accord de confidentialité", description: "Non-disclosure agreement couvrant le code, les données et la stratégie.", category: "hr", isMandatory: true, action: "sign" },
    { id: "tech-charte-it", title: "Charte informatique & sécurité", description: "Règles d'utilisation des outils, politique de mots de passe, BYOD.", category: "hr", isMandatory: true, action: "sign" },
    { id: "tech-acces-stack", title: "Setup stack SaaS", description: "Liste des outils à provisionner (Slack, GitHub, Notion, Figma, Jira…).", category: "equipment", isMandatory: true, action: "generate" },
    { id: "tech-okrs", title: "OKRs 30/60/90 jours", description: "Objectifs clairs pour les 3 premiers mois avec indicateurs de succès.", category: "hr", isMandatory: true, action: "generate" },
    { id: "tech-buddy-pairing", title: "Buddy pairing letter", description: "Désignation officielle du buddy, périmètre et durée du partenariat.", category: "hr", isMandatory: false, action: "generate" },
    { id: "tech-rgpd-dev", title: "Formation RGPD développeur", description: "Privacy by design, gestion des données personnelles dans le code.", category: "training", isMandatory: true, action: "sign", regulation: "RGPD Art. 25" },
    { id: "tech-retro-onboarding", title: "Rétro onboarding 30 jours", description: "Feedback structuré après le premier mois pour améliorer le parcours.", category: "hr", isMandatory: false, action: "generate" },
  ],
  regulations: [
    { code: "RGPD-Art25", label: "RGPD Art. 25 — Privacy by design", description: "Obligation d'intégrer la protection des données dès la conception des produits." },
    { code: "CNNum", label: "Conseil National du Numérique — Charte IA", description: "Bonnes pratiques d'utilisation des IA génératives en entreprise." },
    { code: "Conv-Syntec", label: "Convention collective Syntec (IDCC 1486)", description: "Convention des bureaux d'études, cabinets d'ingénieurs et sociétés de conseil." },
    { code: "TT-Accord", label: "Accord de télétravail", description: "Accord collectif encadrant le télétravail, obligatoire si pratique régulière (art. L1222-9 CT)." },
  ],
  procedures: [
    { id: "tech-onboarding-d1", trigger: "Arrivée d'un nouveau talent", title: "Onboarding produit J1–J7", steps: ["Provisionner la stack SaaS (Slack, GitHub, Notion, Figma) la veille J-1", "Welcome call CEO/Head of People (30 min)", "Présentation squad et buddy pairing", "Setup machine + accès validés", "Présentation produit, codebase ou design system selon le profil", "Définir les OKRs 30 jours avec l'Engineering Manager"] },
    { id: "tech-okr-review", trigger: "Fin de période 30 jours", title: "Review OKRs J30", steps: ["Point 1:1 Engineering Manager + talent", "Bilan des OKRs J30 : atteints / en cours / bloquants", "Ajustement des OKRs pour les 30 jours suivants", "Rétro onboarding : feedback sur le parcours", "Valider dans Nexo : revue J30 complétée"] },
  ],
  marketing: {
    headline: "L'onboarding de vos devs aussi smooth que votre produit.",
    subheadline: "Stack provisionnée, OKRs définis, buddy assigné — avant le premier standup.",
    description: "Nexo structure l'onboarding produit de vos talents avec le vocabulaire de votre stack : squads, OKRs, buddy pairing, async — pas de jargon RH hors-sujet.",
    painPoints: [
      { icon: "Laptop", title: "Setup J1 catastrophique", description: "MacBook sans accès, Slack sans canaux, GitHub sans repo — le talent perd foi dès le premier jour." },
      { icon: "Target", title: "OKRs définis trop tard", description: "Sans objectifs clairs à J7, le talent est perdu. À J30 il n'est pas aligné. À J90 il cherche un autre poste." },
      { icon: "UserX", title: "Buddy pairing improvisé", description: "Le buddy est désigné le matin même, sans brief, sans cadre. Le nouveau talent est livré à lui-même." },
    ],
    benefits: [
      { icon: "Zap", title: "Stack provisionnée avant J1", description: "Check-list IT générée automatiquement dès la fiche créée. Zéro oubli le jour J." },
      { icon: "Target", title: "OKRs 30/60/90 structurés", description: "Template OKRs par profil (Eng, Design, PM) à personnaliser en 10 minutes." },
      { icon: "Users", title: "Buddy pairing formalisé", description: "Désignation officielle, périmètre clair, suivi hebdomadaire dans Nexo." },
    ],
    stats: [{ value: "89%", label: "des talents tech considèrent l'onboarding comme critère de décision pour rester" }, { value: "6 mois", label: "délai moyen de productivité pleine sans onboarding structuré vs 45 jours avec" }, { value: "12k€", label: "coût moyen d'un recrutement développeur senior en France" }],
    cta: "Construire mon onboarding produit",
    ctaSecondary: "Voir une démo Tech",
    seoTitle: "Logiciel RH Tech & Startup — Onboarding Développeurs — Nexo",
    seoDescription: "Structurez l'onboarding de vos devs, designers et PMs avec Nexo. OKRs, buddy pairing, stack SaaS. Essai 14 jours.",
    keywords: ["logiciel rh startup", "onboarding développeur", "okr 90 jours", "buddy pairing onboarding", "hr tech startup"],
  },
  brevo: { listId: 9, segmentTag: "tech" },
};

// =============================================================================
// INDEX
// =============================================================================

export const SECTORS: SectorConfig[] = [sap, btp, sante, commerce, associations, hotellerie, transport, tech];

export const SECTORS_MAP: Record<string, SectorConfig> = Object.fromEntries(
  SECTORS.map((s) => [s.id, s])
);

export const SECTORS_BY_SLUG: Record<string, SectorConfig> = Object.fromEntries(
  SECTORS.map((s) => [s.slug, s])
);

export function getSectorBySlug(slug: string): SectorConfig | undefined {
  return SECTORS_BY_SLUG[slug];
}

export function getSectorById(id: string): SectorConfig | undefined {
  return SECTORS_MAP[id];
}

/** Retourne la config du secteur correspondant à l'industrie tenant */
export function getSectorByIndustry(industry: string | null | undefined): SectorConfig | undefined {
  if (!industry) return undefined;
  return SECTORS.find((s) => s.id === industry || s.slug === industry);
}
