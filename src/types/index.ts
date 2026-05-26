// =============================================================================
// GENIO CORE — Point d'entrée des types
// import { type Entity, type Tenant, VERTICAL_PACKS } from '@/types'
// =============================================================================

export type { Database, Json } from './database.types'

export type {
  Vertical, PlanSlug, SubStatus, MemberRole, EntityType, EntityStatus,
  PipelineStage, AcquisitionSource, DocumentType, SignatureStatus,
  CertificationStatus, FormationStatus, VoiceNoteStatus, ItineraryStatus,
  StopStatus, InterventionStatus, BillingDocType, PaymentStatus,
  AlertStatus, ReminderChannel, ReminderStatus, PdfOutputStatus, RoutingEngine,
} from './database.types'

export type {
  EntityMetadata, EmployeeMetadata, CandidateMetadata, PatientMetadata,
  AnimalMetadata, ClientMetadata, BillingLine, ChecklistItem, VoiceActionItem,
  AiStructuredBrief, ComplianceDetails, TenantVocab, TenantTheme,
} from './database.types'

export type { Row, Insert, Update } from './domain.types'

export type {
  Tenant, TenantWithPlan, TenantWithConfig, TenantConfig, ActiveModules,
  Profile, Membership, UserContext,
  Entity, TypedEntity, EmployeeEntity, CandidateEntity, PatientEntity,
  AnimalEntity, ClientEntity, AnyEntity, EntityWithRelations, EntityWithOnboarding,
  Brief, BriefWithPipeline, PipelineEntry, KanbanView,
  Onboarding, OnboardingTask, OnboardingWithTasks, TasksByCategory,
  Document, DocumentWithEntity, ExpiryStatus,
  Regulation, Certification, Formation, ComplianceScore, ComplianceSummary,
  PdfTemplate, PdfOutput, PdfOutputWithTemplate,
  VoiceNote, VoiceNoteWithEntity,
  ItinerarySession, ItineraryStop, Intervention, SessionWithStops, StopWithEntity, GeoPoint,
  BillingDocument, BillingDocumentWithEntity,
  DashboardStats, PostItAlert,
  ApiSuccess, ApiError, ApiResponse,
  CreateEntityForm, CreateBriefForm, CreateOnboardingForm, CreateBillingForm,
  VerticalPack,
} from './domain.types'

export {
  isEmployee, isCandidate, isPatient, isAnimal, isClient,
  getExpiryStatus, buildComplianceSummary, parseGeoPoint, computeBillingTotals,
  isApiError,
  VERTICAL_PACKS,
} from './domain.types'
