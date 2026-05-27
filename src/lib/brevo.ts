// =============================================================================
// Brevo (ex-Sendinblue) — Client API
// Docs : https://developers.brevo.com/reference
// =============================================================================

const BREVO_API_KEY = process.env.BREVO_API_KEY ?? "";
const BREVO_BASE    = "https://api.brevo.com/v3";

// ── IDs de listes ─────────────────────────────────────────────────────────────
// À remplacer par les vrais IDs de vos listes Brevo
export const BREVO_LISTS = {
  prospects:      1,  // Newsletter / Prospects général
  sap:            2,  // Services à la personne
  btp:            3,  // Industrie & BTP
  sante:          4,  // Santé & médico-social
  commerce:       5,  // Commerce & distribution
  asso:           6,  // Associations
  hotel:          7,  // Hôtellerie & restauration
  transport:      8,  // Transport & logistique
  tech:           9,  // Tech & startup
  trialing:       10, // Utilisateurs en essai
  paying:         11, // Clients payants
} as const;

// ── IDs de templates transactionnels ─────────────────────────────────────────
// À créer dans Brevo > Transactional > Templates
export const BREVO_TEMPLATES = {
  welcome:          1,  // Bienvenue + lien onboarding
  trial_tip_day3:   2,  // Astuce J+3 : créer le premier collaborateur
  trial_tip_day7:   3,  // Astuce J+7 : paramétrer les documents
  trial_ending_d4:  4,  // Essai se termine dans 4 jours
  trial_ending_d1:  5,  // Essai se termine demain
  trial_expired:    6,  // Essai expiré — passer au plan payant
  upgrade_confirm:  7,  // Confirmation de mise à niveau
  // ── Par secteur (welcome sur-mesure) ──
  welcome_sap:      11,
  welcome_btp:      12,
  welcome_sante:    13,
  welcome_commerce: 14,
  welcome_asso:     15,
  welcome_hotel:    16,
  welcome_transport:17,
  welcome_tech:     18,
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type BrevoContactAttributes = {
  PRENOM?:     string | undefined;
  NOM?:        string | undefined;
  ENTREPRISE?: string | undefined;
  SECTEUR?:    string | undefined;
  PLAN?:       string | undefined;
  TRIAL_END?:  string | undefined;
  [key: string]: string | number | boolean | undefined;
};

// ── Helpers internes ──────────────────────────────────────────────────────────

async function brevoFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!BREVO_API_KEY) {
    console.warn("[Brevo] BREVO_API_KEY manquant — appel ignoré");
    return {} as T;
  }

  const res = await fetch(`${BREVO_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type":  "application/json",
      "accept":        "application/json",
      "api-key":       BREVO_API_KEY,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[Brevo] ${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
    return {} as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// =============================================================================
// API publique
// =============================================================================

/**
 * Crée ou met à jour un contact Brevo.
 * Si le contact existe déjà, ses attributs sont fusionnés.
 */
export async function brevoUpsertContact(params: {
  email:          string;
  firstName?:     string | undefined;
  lastName?:      string | undefined;
  attributes?:    BrevoContactAttributes | undefined;
  listIds?:       number[] | undefined;
  updateEnabled?: boolean | undefined;
}) {
  return brevoFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email:          params.email,
      attributes: {
        PRENOM: params.firstName,
        NOM:    params.lastName,
        ...params.attributes,
      },
      listIds:       params.listIds ?? [],
      updateEnabled: params.updateEnabled ?? true,
    }),
  });
}

/**
 * Ajoute un ou plusieurs contacts à une liste Brevo.
 */
export async function brevoAddToList(listId: number, emails: string[]) {
  return brevoFetch(`/contacts/lists/${listId}/contacts/add`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
}

/**
 * Retire un contact d'une liste Brevo.
 */
export async function brevoRemoveFromList(listId: number, emails: string[]) {
  return brevoFetch(`/contacts/lists/${listId}/contacts/remove`, {
    method: "POST",
    body: JSON.stringify({ emails }),
  });
}

/**
 * Envoie un email transactionnel via un template Brevo.
 */
export async function brevoSendTemplate(params: {
  templateId: number;
  to: { email: string; name?: string }[];
  params?: Record<string, string | number>;
  replyTo?: { email: string; name?: string };
}) {
  return brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      templateId: params.templateId,
      to:         params.to,
      params:     params.params ?? {},
      replyTo:    params.replyTo,
    }),
  });
}

/**
 * Met à jour les attributs d'un contact existant.
 */
export async function brevoUpdateContact(email: string, attributes: BrevoContactAttributes) {
  return brevoFetch(`/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    body: JSON.stringify({ attributes }),
  });
}

// =============================================================================
// Scénarios métier Nexo
// =============================================================================

/**
 * Déclenché au signup — ajoute le contact à la liste prospects + liste secteur,
 * envoie l'email de bienvenue adapté au secteur.
 */
export async function onUserSignup(params: {
  email:        string;
  firstName?:   string | undefined;
  lastName?:    string | undefined;
  company?:     string | undefined;
  sector?:      string | undefined;
  trialEndAt?:  Date   | undefined;
}) {
  const { email, firstName, lastName, company, sector, trialEndAt } = params;

  const sectorListId = sector ? (BREVO_LISTS[sector as keyof typeof BREVO_LISTS] ?? BREVO_LISTS.prospects) : BREVO_LISTS.prospects;
  const listIds      = Array.from(new Set([BREVO_LISTS.prospects, BREVO_LISTS.trialing, sectorListId]));

  // Upsert contact + listes
  await brevoUpsertContact({
    email,
    firstName,
    lastName,
    attributes: {
      ENTREPRISE: company,
      SECTEUR:    sector?.toUpperCase() ?? "",
      PLAN:       "TRIAL",
      TRIAL_END:  trialEndAt?.toISOString().split("T")[0] ?? "",
    },
    listIds,
  });

  // Email de bienvenue sectoriel
  const templateKey = `welcome_${sector}` as keyof typeof BREVO_TEMPLATES;
  const templateId  = BREVO_TEMPLATES[templateKey] ?? BREVO_TEMPLATES.welcome;

  await brevoSendTemplate({
    templateId,
    to: [{ email, name: [firstName, lastName].filter(Boolean).join(" ") || email }],
    params: {
      PRENOM:    firstName ?? "",
      ENTREPRISE: company ?? "",
      TRIAL_END: trialEndAt?.toLocaleDateString("fr-FR") ?? "",
    },
  });
}

/**
 * Déclenché quand un utilisateur passe à un plan payant.
 */
export async function onUserUpgraded(params: {
  email: string;
  plan:  string;
}) {
  const { email, plan } = params;

  await brevoUpdateContact(email, { PLAN: plan.toUpperCase() });
  await brevoRemoveFromList(BREVO_LISTS.trialing, [email]);
  await brevoAddToList(BREVO_LISTS.paying, [email]);
  await brevoSendTemplate({
    templateId: BREVO_TEMPLATES.upgrade_confirm,
    to: [{ email }],
    params: { PLAN: plan },
  });
}

/**
 * Déclenché par le Cron trial-expiry — J-4 et J-1.
 */
export async function onTrialReminder(params: {
  email:    string;
  daysLeft: 4 | 1;
}) {
  const templateId = params.daysLeft === 4
    ? BREVO_TEMPLATES.trial_ending_d4
    : BREVO_TEMPLATES.trial_ending_d1;

  return brevoSendTemplate({
    templateId,
    to: [{ email: params.email }],
    params: { DAYS_LEFT: params.daysLeft },
  });
}

/**
 * Capture d'un lead depuis une landing page secteur.
 * Ajoute à la liste prospects + liste secteur sans envoi d'email immédiat.
 */
export async function onLandingPageLead(params: {
  email:      string;
  firstName?: string | undefined;
  company?:   string | undefined;
  sector:     string;
}) {
  const { email, firstName, company, sector } = params;
  const sectorListId = BREVO_LISTS[sector as keyof typeof BREVO_LISTS] ?? BREVO_LISTS.prospects;

  return brevoUpsertContact({
    email,
    firstName,
    attributes: {
      ENTREPRISE: company,
      SECTEUR:    sector.toUpperCase(),
      PLAN:       "LEAD",
    },
    listIds: [BREVO_LISTS.prospects, sectorListId],
  });
}
