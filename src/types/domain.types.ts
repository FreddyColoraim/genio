// =============================================================================
// GENIO CORE — Types domaine (au-dessus des types bruts Supabase)
// Inclut la dimension internationale européenne
// =============================================================================

import type {
  Database,
  EntityMetadata,
  EmployeeMetadata,
  CandidateMetadata,
  PatientMetadata,
  AnimalMetadata,
  ClientMetadata,
  BillingLine,
  VoiceActionItem,
  AiStructuredBrief,
  ComplianceDetails,
  TenantVocab,
  TenantTheme,
  EntityType,
  Vertical,
  MemberRole,
  PipelineStage,
} from './database.types'

type Tables = Database['public']['Tables']

// ---------------------------------------------------------------------------
// Helpers génériques
// ---------------------------------------------------------------------------

export type Row<T extends keyof Tables> = Tables[T]['Row']
export type Insert<T extends keyof Tables> = Tables[T]['Insert']
export type Update<T extends keyof Tables> = Tables[T]['Update']

// ---------------------------------------------------------------------------
// Tenant & Config
// ---------------------------------------------------------------------------

export type Tenant = Row<'tenants'>

export type TenantWithPlan = Tenant & { plan: Row<'plans'> }

export type TenantConfig = Row<'tenant_config'> & {
  vocab: TenantVocab
  theme: TenantTheme | null
}

export type TenantWithConfig = Tenant & { config: TenantConfig }

export interface ActiveModules {
  acquisition: boolean
  crm: boolean
  onboarding: boolean
  documents: boolean
  regulations: boolean
  pdf: boolean
  voice: boolean
  itinerary: boolean
  billing: boolean
}

// ---------------------------------------------------------------------------
// Utilisateur & Session
// ---------------------------------------------------------------------------

export type Profile = Row<'profiles'>
export type Membership = Row<'memberships'>

export interface UserContext {
  userId: string
  email: string
  profile: Profile
  tenantId: string
  tenant: TenantWithConfig
  role: MemberRole
  modules: ActiveModules
}

// ---------------------------------------------------------------------------
// Entités CRM — unions discriminées
// ---------------------------------------------------------------------------

export type Entity = Row<'entities'>

export type TypedEntity<T extends EntityType, M extends EntityMetadata = EntityMetadata> =
  Omit<Entity, 'entity_type' | 'metadata'> & { entity_type: T; metadata: M }

export type EmployeeEntity  = TypedEntity<'employee',    EmployeeMetadata>
export type CandidateEntity = TypedEntity<'candidate',   CandidateMetadata>
export type PatientEntity   = TypedEntity<'patient',     PatientMetadata>
export type AnimalEntity    = TypedEntity<'animal',      AnimalMetadata>
export type ClientEntity    = TypedEntity<'client',      ClientMetadata>

export type AnyEntity = EmployeeEntity | CandidateEntity | PatientEntity | AnimalEntity | ClientEntity

export type EntityWithRelations = Entity & {
  relations: Array<Row<'entity_relations'> & { related_entity: Entity }>
  events: Row<'entity_events'>[]
  compliance: Row<'compliance_scores'> | null
}

export type EntityWithOnboarding = Entity & {
  onboarding: OnboardingWithTasks | null
}

export function isEmployee(e: Entity): e is EmployeeEntity   { return e.entity_type === 'employee' }
export function isCandidate(e: Entity): e is CandidateEntity { return e.entity_type === 'candidate' }
export function isPatient(e: Entity): e is PatientEntity     { return e.entity_type === 'patient' }
export function isAnimal(e: Entity): e is AnimalEntity       { return e.entity_type === 'animal' }
export function isClient(e: Entity): e is ClientEntity       { return e.entity_type === 'client' }

// ---------------------------------------------------------------------------
// Acquisition
// ---------------------------------------------------------------------------

export type Brief = Row<'briefs'> & { ai_structured: AiStructuredBrief | null }

export type BriefWithPipeline = Brief & {
  pipeline: PipelineEntry[]
  job_post: Row<'job_posts'> | null
}

export type PipelineEntry = Row<'pipeline_stages'> & { entity: Entity }

export type KanbanView = Record<PipelineStage, PipelineEntry[]>

// ---------------------------------------------------------------------------
// Onboarding & Tâches
// ---------------------------------------------------------------------------

export type Onboarding = Row<'onboardings'>
export type OnboardingTask = Row<'onboarding_tasks'>

export type OnboardingWithTasks = Onboarding & {
  tasks: OnboardingTask[]
  entity: Entity
  assigned_profile: Profile | null
}

export type TasksByCategory = Record<string, OnboardingTask[]>

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type Document = Row<'documents'>
export type DocumentWithEntity = Document & { entity: Entity | null }

export type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired' | 'no_expiry'

export function getExpiryStatus(expiresAt: string | null, warnDays = 30): ExpiryStatus {
  if (!expiresAt) return 'no_expiry'
  const daysLeft = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= warnDays) return 'expiring_soon'
  return 'valid'
}

// ---------------------------------------------------------------------------
// Réglementation & Conformité
// ---------------------------------------------------------------------------

export type Regulation    = Row<'regulations'>
export type Certification = Row<'certifications'>
export type Formation     = Row<'formations'>

export type ComplianceScore = Row<'compliance_scores'> & { details: ComplianceDetails | null }

export interface ComplianceSummary {
  score: number
  label: 'Conforme' | 'Attention' | 'Non conforme'
  color: 'green' | 'amber' | 'red'
  missing: number
  expiring: number
  overdue: number
}

export function buildComplianceSummary(score: Row<'compliance_scores'>): ComplianceSummary {
  const s = score.score
  return {
    score: s,
    label: s >= 80 ? 'Conforme' : s >= 50 ? 'Attention' : 'Non conforme',
    color: s >= 80 ? 'green' : s >= 50 ? 'amber' : 'red',
    missing: score.missing_docs,
    expiring: score.expiring_soon,
    overdue: score.overdue,
  }
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export type PdfTemplate = Row<'pdf_templates'>
export type PdfOutput   = Row<'pdf_outputs'>
export type PdfOutputWithTemplate = PdfOutput & { template: PdfTemplate | null }

// ---------------------------------------------------------------------------
// Notes vocales
// ---------------------------------------------------------------------------

export type VoiceNote = Row<'voice_notes'> & { ai_action_items: VoiceActionItem[] | null }
export type VoiceNoteWithEntity = VoiceNote & { entity: Entity | null }

// ---------------------------------------------------------------------------
// Itinéraires & Terrain
// ---------------------------------------------------------------------------

export type ItinerarySession = Row<'itinerary_sessions'>
export type ItineraryStop    = Row<'itinerary_stops'>
export type Intervention     = Row<'interventions'>

export type SessionWithStops = ItinerarySession & { stops: StopWithEntity[] }
export type StopWithEntity   = ItineraryStop & { entity: Entity | null; intervention: Intervention | null }

export interface GeoPoint { lat: number; lng: number }

export function parseGeoPoint(location: unknown): GeoPoint | null {
  if (!location || typeof location !== 'object') return null
  const loc = location as Record<string, unknown>
  if (loc['type'] === 'Point' && Array.isArray(loc['coordinates'])) {
    const [lng, lat] = loc['coordinates'] as [number, number]
    return { lat, lng }
  }
  return null
}

// ---------------------------------------------------------------------------
// Facturation
// ---------------------------------------------------------------------------

export type BillingDocument = Row<'billing_documents'> & { lines: BillingLine[] }
export type BillingDocumentWithEntity = BillingDocument & { entity: Entity | null; pdf: PdfOutput | null }

export function computeBillingTotals(lines: BillingLine[], taxRate: number) {
  const subtotal  = lines.reduce((s, l) => s + l.total, 0)
  const taxAmount = parseFloat((subtotal * taxRate / 100).toFixed(2))
  const total     = parseFloat((subtotal + taxAmount).toFixed(2))
  return { subtotal, taxAmount, total }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  activeEntities: number
  onboardingsInProgress: number
  documentsExpiringSoon: number
  tasksOverdue: number
  complianceAvgScore: number
  todayInterventions: number
}

export interface PostItAlert {
  id: string
  type: 'document' | 'certification' | 'task' | 'onboarding' | 'formation' | 'trial'
  label: string
  entity_id: string | null
  entity_name: string | null
  urgency: 'low' | 'medium' | 'high'
  due_at: string | null
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> { data: T; error: null }
export interface ApiError       { data: null; error: { message: string; code?: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

export function isApiError<T>(res: ApiResponse<T>): res is ApiError {
  return res.error !== null
}

// ---------------------------------------------------------------------------
// Formulaires
// ---------------------------------------------------------------------------

export interface CreateEntityForm {
  entity_type: EntityType
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  birth_date?: string
  address_line1?: string
  city?: string
  postal_code?: string
  assigned_to?: string
  metadata?: Record<string, unknown>
  tags?: string[]
}

export interface CreateBriefForm {
  title: string
  description?: string
  contract_type?: string
  location?: string
  urgency?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface CreateOnboardingForm {
  entity_id: string
  template_id?: string
  title: string
  start_date?: string
  trial_end_date?: string
  assigned_to?: string
}

export interface CreateBillingForm {
  doc_type: 'quote' | 'invoice'
  entity_id?: string
  title?: string
  lines: BillingLine[]
  tax_rate: number
  issued_at?: string
  due_at?: string
}

// ---------------------------------------------------------------------------
// RGPD — Types de conformité
// ---------------------------------------------------------------------------

export type GdprRequestType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'portability'
  | 'restriction'
  | 'objection'

export type GdprRequestStatus = 'pending' | 'in_progress' | 'completed' | 'refused'

export type GdprConsentType =
  | 'marketing'
  | 'analytics'
  | 'data_processing'
  | 'portail_access'
  | 'newsletter'

export type GdprLegalBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'legitimate_interest'

// ---------------------------------------------------------------------------
// International — Localisation & Devises
// ---------------------------------------------------------------------------

export type { Locale, EUCountry, EuropeanCountry, EUCurrency } from '@/lib/i18n/config'

// TenantConfig étendu avec i18n
export interface TenantLocaleConfig {
  supported_locales: string[]
  default_currency: string
  date_format: string
  gdpr_dpa_signed_at: string | null
  gdpr_dpa_name: string | null
  data_retention_days: number
}

// ---------------------------------------------------------------------------
// Packs verticaux — configuration par métier (le cœur de GeniO)
// ---------------------------------------------------------------------------

export interface VerticalPack {
  vertical: Vertical
  label: string
  entity_types: EntityType[]
  default_modules: {
    acquisition: boolean
    crm: boolean
    onboarding: boolean
    documents: boolean
    regulations: boolean
    pdf: boolean
    voice: boolean
    itinerary: boolean
    billing: boolean
  }
  vocab: TenantVocab
  signup_onboarding_steps: Array<{
    key: string
    title: string
    description: string
  }>
}

export const VERTICAL_PACKS: Record<string, VerticalPack> = {
  rh: {
    vertical: 'rh',
    label: 'Nexo RH',
    entity_types: ['employee', 'candidate'],
    default_modules: {
      acquisition: true, crm: true, onboarding: true, documents: true,
      regulations: true, pdf: true, voice: false, itinerary: false, billing: false,
    },
    vocab: {
      entity: 'collaborateur', entities: 'collaborateurs',
      brief: 'brief RH',
      pipeline_stage_new: 'Nouveau', pipeline_stage_active: 'En poste', pipeline_stage_closed: 'Sorti',
    },
    signup_onboarding_steps: [
      { key: 'company',    title: 'Votre entreprise',       description: 'Renseignez le nom et le secteur.' },
      { key: 'team',       title: 'Vos équipes',            description: 'Ajoutez vos premiers collaborateurs.' },
      { key: 'first_brief',title: 'Premier besoin RH',      description: 'Créez votre premier brief de recrutement.' },
      { key: 'documents',  title: 'Coffre documentaire',    description: 'Configurez les types de documents requis.' },
    ],
  },
  care: {
    vertical: 'care',
    label: 'Nexo Care',
    entity_types: ['patient'],
    default_modules: {
      acquisition: false, crm: true, onboarding: true, documents: true,
      regulations: true, pdf: true, voice: true, itinerary: true, billing: false,
    },
    vocab: {
      entity: 'patient', entities: 'patients',
      brief: 'demande de soins',
      pipeline_stage_new: 'Nouveau patient', pipeline_stage_active: 'Suivi actif', pipeline_stage_closed: 'Clôturé',
    },
    signup_onboarding_steps: [
      { key: 'cabinet',    title: 'Votre cabinet',          description: 'Renseignez le nom et l\'adresse.' },
      { key: 'patients',   title: 'Premiers patients',      description: 'Importez ou ajoutez vos patients.' },
      { key: 'itinerary',  title: 'Tournées de soins',      description: 'Configurez vos zones géographiques.' },
      { key: 'reminders',  title: 'Rappels automatiques',   description: 'Activez les rappels de visites.' },
    ],
  },
  craft: {
    vertical: 'craft',
    label: 'Nexo Craft',
    entity_types: ['client', 'site'],
    default_modules: {
      acquisition: true, crm: true, onboarding: false, documents: true,
      regulations: false, pdf: true, voice: true, itinerary: true, billing: true,
    },
    vocab: {
      entity: 'client', entities: 'clients',
      brief: 'demande client',
      pipeline_stage_new: 'Prospect', pipeline_stage_active: 'Chantier en cours', pipeline_stage_closed: 'Terminé',
    },
    signup_onboarding_steps: [
      { key: 'company',    title: 'Votre entreprise',       description: 'Renseignez le nom et le métier.' },
      { key: 'team',       title: 'Vos équipes',            description: 'Ajoutez vos techniciens et ouvriers.' },
      { key: 'zones',      title: 'Zones d\'intervention',  description: 'Définissez vos secteurs géographiques.' },
      { key: 'billing',    title: 'Devis & facturation',    description: 'Configurez vos tarifs et modèles.' },
    ],
  },
  vet: {
    vertical: 'vet',
    label: 'Nexo Vet',
    entity_types: ['animal', 'client'],
    default_modules: {
      acquisition: false, crm: true, onboarding: false, documents: true,
      regulations: true, pdf: true, voice: true, itinerary: true, billing: false,
    },
    vocab: {
      entity: 'animal', entities: 'animaux',
      brief: 'consultation',
      pipeline_stage_new: 'Nouveau patient', pipeline_stage_active: 'Suivi vétérinaire', pipeline_stage_closed: 'Archivé',
    },
    signup_onboarding_steps: [
      { key: 'clinic',     title: 'Votre clinique',         description: 'Renseignez le nom et l\'adresse.' },
      { key: 'animals',    title: 'Premiers animaux',       description: 'Ajoutez vos premiers patients.' },
      { key: 'reminders',  title: 'Rappels vaccins',        description: 'Configurez les rappels de vaccination.' },
      { key: 'ai',         title: 'IA consultation',        description: 'Activez l\'assistant de consultation.' },
    ],
  },
  field: {
    vertical: 'field',
    label: 'Nexo Field',
    entity_types: ['beneficiary'],
    default_modules: {
      acquisition: false, crm: true, onboarding: true, documents: true,
      regulations: false, pdf: true, voice: false, itinerary: true, billing: false,
    },
    vocab: {
      entity: 'bénéficiaire', entities: 'bénéficiaires',
      brief: 'demande d\'intervention',
      pipeline_stage_new: 'Demande reçue', pipeline_stage_active: 'Suivi actif', pipeline_stage_closed: 'Clôturé',
    },
    signup_onboarding_steps: [
      { key: 'structure',  title: 'Votre structure',        description: 'Renseignez le nom et le secteur.' },
      { key: 'team',       title: 'Vos intervenants',       description: 'Ajoutez votre équipe terrain.' },
      { key: 'zones',      title: 'Zones d\'intervention',  description: 'Définissez vos secteurs géographiques.' },
      { key: 'planning',   title: 'Planning hebdo',         description: 'Configurez les créneaux d\'intervention.' },
    ],
  },
}
