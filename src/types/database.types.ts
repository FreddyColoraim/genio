// =============================================================================
// GENIO CORE — Types base de données Supabase
// Généré manuellement — remplacer par : supabase gen types typescript --project-id <id>
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Scalaires métier
// ---------------------------------------------------------------------------

export type Vertical =
  | 'rh'
  | 'care'
  | 'craft'
  | 'vet'
  | 'field'
  | 'association'
  | (string & Record<never, never>)

export type PlanSlug = 'free' | 'starter' | 'pro' | 'business'

export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export type MemberRole =
  | 'owner'
  | 'admin'
  | 'rh'
  | 'manager'
  | 'member'
  | 'readonly'
  | 'field_agent'
  | 'nurse'
  | 'vet'
  | 'craftsman'

export type EntityType =
  | 'employee'
  | 'candidate'
  | 'patient'
  | 'animal'
  | 'client'
  | 'beneficiary'
  | 'lead'
  | 'site'

export type EntityStatus = 'active' | 'inactive' | 'archived'

export type PipelineStage =
  | 'new' | 'contacted' | 'interview' | 'retained' | 'refused'
  | 'prospect' | 'quoted' | 'won' | 'lost'
  | 'scheduled' | 'active' | 'closed'

export type AcquisitionSource =
  | 'linkedin' | 'website' | 'ad' | 'referral' | 'cooptation' | 'event' | 'other'

export type DocumentType =
  | 'id_card' | 'contract' | 'rib' | 'diploma' | 'license'
  | 'certification' | 'medical_cert' | 'prescription' | 'invoice' | 'quote'
  | (string & Record<never, never>)

export type SignatureStatus = 'pending' | 'signed' | 'refused'
export type CertificationStatus = 'valid' | 'expiring' | 'expired' | 'pending'
export type FormationStatus = 'planned' | 'in_progress' | 'completed' | 'canceled'
export type VoiceNoteStatus = 'processing' | 'transcribed' | 'structured' | 'failed'
export type ItineraryStatus = 'draft' | 'active' | 'completed'
export type StopStatus = 'pending' | 'arrived' | 'completed' | 'skipped'
export type InterventionStatus = 'planned' | 'in_progress' | 'completed' | 'canceled'
export type BillingDocType = 'quote' | 'invoice' | 'credit_note'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'canceled'
export type AlertStatus = 'pending' | 'notified' | 'resolved' | 'ignored'
export type ReminderChannel = 'email' | 'push' | 'sms'
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'dismissed'
export type PdfOutputStatus = 'pending' | 'generated' | 'failed'
export type RoutingEngine = 'google' | 'osrm'

// ---------------------------------------------------------------------------
// Types JSONB métier
// ---------------------------------------------------------------------------

export type EntityMetadata =
  | EmployeeMetadata
  | CandidateMetadata
  | PatientMetadata
  | AnimalMetadata
  | ClientMetadata
  | Record<string, Json>

export interface EmployeeMetadata {
  [key: string]: Json | undefined
  poste?: string
  departement?: string
  seniority?: string
  type_contrat?: string
  salaire_brut?: number
  manager_id?: string
  site?: string
}

export interface CandidateMetadata {
  [key: string]: Json | undefined
  cv_url?: string
  linkedin_url?: string
  pretention_salariale?: number
  disponibilite?: string
  mobilite?: boolean
}

export interface PatientMetadata {
  [key: string]: Json | undefined
  numero_secu?: string
  medecin_traitant?: string
  pathologies?: string[]
  allergies?: string[]
  groupe_sanguin?: string
  mutuelle?: string
}

export interface AnimalMetadata {
  [key: string]: Json | undefined
  species?: string
  breed?: string
  color?: string
  weight_kg?: number
  chip_number?: string
  passport_number?: string
  neutered?: boolean
  vaccinations?: string[]
}

export interface ClientMetadata {
  [key: string]: Json | undefined
  secteur_activite?: string
  siret?: string
  nombre_salaries?: number
  ca_annuel?: number
  contact_principal?: string
}

export interface BillingLine {
  label: string
  description?: string
  quantity: number
  unit_price: number
  unit?: string
  total: number
  vat_rate?: number
}

export interface ChecklistItem {
  key: string
  label: string
  category: 'document' | 'materiel' | 'formation' | 'admin' | 'access' | (string & Record<never, never>)
  required?: boolean
  description?: string
}

export interface VoiceActionItem {
  type: 'task' | 'brief' | 'note' | 'reminder'
  title: string
  body?: string
  due_date?: string
  entity_id?: string
}

export interface AiStructuredBrief {
  titre: string
  missions: string[]
  profil: string
  competences: string[]
  type_contrat: string
  localisation: string
  urgence: 'low' | 'normal' | 'high' | 'urgent'
  salaire?: string
  notes?: string
}

export interface ComplianceDetails {
  missing_docs: Array<{ label: string; type: string }>
  expiring_items: Array<{ label: string; expires_at: string; days_left: number }>
  overdue_items: Array<{ label: string; expired_at: string }>
}

export interface TenantVocab {
  entity: string
  entities: string
  brief: string
  pipeline_stage_new: string
  pipeline_stage_active: string
  pipeline_stage_closed: string
  [key: string]: string
}

export interface TenantTheme {
  primary_color?: string
  accent_color?: string
  logo_url?: string
  font?: string
}

// ---------------------------------------------------------------------------
// Database — tables Row / Insert / Update
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {

      plans: {
        Row: {
          id: string
          slug: PlanSlug
          name: string
          price_monthly: number
          price_yearly: number
          max_users: number
          max_entities: number
          max_storage_gb: number
          features: Json
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }

      resellers: {
        Row: {
          id: string
          name: string
          slug: string
          contact_email: string
          stripe_account_id: string | null
          commission_pct: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['resellers']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['resellers']['Insert']>
      }

      tenants: {
        Row: {
          id: string
          plan_id: string
          name: string
          slug: string
          vertical: Vertical
          stripe_customer_id: string | null
          stripe_sub_id: string | null
          sub_status: SubStatus
          trial_ends_at: string | null
          wl_reseller_id: string | null
          wl_brand_name: string | null
          wl_logo_url: string | null
          wl_primary_color: string | null
          wl_accent_color: string | null
          wl_domain: string | null
          country: string
          timezone: string
          locale: string
          address_line1: string | null
          address_line2: string | null
          city: string | null
          postal_code: string | null
          siret: string | null
          vat_number: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }

      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          locale: string | null
          created_at: string
          updated_at: string
        }
        Insert: { id: string } & Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id'>>
      }

      memberships: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: MemberRole
          is_active: boolean
          invited_by: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['memberships']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>
      }

      entities: {
        Row: {
          id: string
          tenant_id: string
          entity_type: EntityType
          ref_number: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          birth_date: string | null
          gender: 'M' | 'F' | 'other' | null
          nationality: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          postal_code: string | null
          country: string
          status: EntityStatus
          lifecycle_stage: string | null
          assigned_to: string | null
          metadata: Json
          tags: string[]
          created_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['entities']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['entities']['Insert']>
      }

      entity_relations: {
        Row: {
          id: string
          tenant_id: string
          from_entity: string
          to_entity: string
          relation_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['entity_relations']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['entity_relations']['Insert']>
      }

      entity_events: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          event_type: string
          title: string | null
          body: string | null
          metadata: Json | null
          occurred_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['entity_events']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['entity_events']['Insert']>
      }

      briefs: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          contract_type: string | null
          location: string | null
          urgency: 'low' | 'normal' | 'high' | 'urgent'
          voice_note_url: string | null
          voice_transcript: string | null
          ai_structured: Json | null
          status: 'draft' | 'open' | 'closed' | 'archived'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['briefs']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['briefs']['Insert']>
      }

      job_posts: {
        Row: {
          id: string
          tenant_id: string
          brief_id: string | null
          title: string
          content: string | null
          status: 'draft' | 'published' | 'closed'
          published_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['job_posts']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['job_posts']['Insert']>
      }

      pipeline_stages: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          brief_id: string | null
          stage: PipelineStage
          source: AcquisitionSource | null
          notes: string | null
          score: number | null
          metadata: Json | null
          moved_at: string
          moved_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pipeline_stages']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['pipeline_stages']['Insert']>
      }

      checklist_templates: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          vertical: Vertical | null
          role_target: string | null
          items: Json
          is_default: boolean | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['checklist_templates']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['checklist_templates']['Insert']>
      }

      onboardings: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          template_id: string | null
          title: string
          start_date: string | null
          end_date: string | null
          trial_end_date: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'abandoned'
          completion_pct: number
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['onboardings']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['onboardings']['Insert']>
      }

      onboarding_tasks: {
        Row: {
          id: string
          tenant_id: string
          onboarding_id: string
          key: string | null
          title: string
          description: string | null
          category: string | null
          priority: number
          due_date: string | null
          completed_at: string | null
          completed_by: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['onboarding_tasks']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['onboarding_tasks']['Insert']>
      }

      documents: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          doc_type: DocumentType
          name: string
          file_path: string
          file_size_kb: number | null
          mime_type: string | null
          ocr_text: string | null
          ai_summary: string | null
          ai_extracted: Json | null
          issued_at: string | null
          expires_at: string | null
          expiry_alerted: boolean | null
          signature_status: SignatureStatus | null
          docusign_envelope_id: string | null
          signed_at: string | null
          uploaded_by: string | null
          is_verified: boolean | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }

      expiry_alerts: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          document_id: string | null
          regulation_id: string | null
          alert_type: 'document' | 'certification' | 'formation'
          label: string
          expires_at: string
          days_until: number | null
          status: AlertStatus
          notified_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expiry_alerts']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['expiry_alerts']['Insert']>
      }

      regulations: {
        Row: {
          id: string
          tenant_id: string | null
          vertical: Vertical | null
          code: string
          name: string
          description: string | null
          validity_days: number | null
          is_mandatory: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['regulations']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['regulations']['Insert']>
      }

      certifications: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          regulation_id: string | null
          code: string | null
          name: string
          document_id: string | null
          obtained_at: string | null
          expires_at: string | null
          issuer: string | null
          status: CertificationStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['certifications']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['certifications']['Insert']>
      }

      formations: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          regulation_id: string | null
          title: string
          provider: string | null
          scheduled_at: string | null
          completed_at: string | null
          expires_at: string | null
          duration_h: number | null
          cost: number | null
          document_id: string | null
          status: FormationStatus
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['formations']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['formations']['Insert']>
      }

      compliance_scores: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          score: number
          missing_docs: number
          expiring_soon: number
          overdue: number
          details: Json | null
          computed_at: string
        }
        Insert: Omit<Database['public']['Tables']['compliance_scores']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['compliance_scores']['Insert']>
      }

      pdf_templates: {
        Row: {
          id: string
          tenant_id: string | null
          vertical: Vertical | null
          slug: string
          name: string
          description: string | null
          template_html: string
          variables: Json
          is_active: boolean | null
          version: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pdf_templates']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['pdf_templates']['Insert']>
      }

      pdf_outputs: {
        Row: {
          id: string
          tenant_id: string
          template_id: string | null
          entity_id: string | null
          title: string
          file_path: string | null
          data_snapshot: Json
          status: PdfOutputStatus
          generated_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pdf_outputs']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['pdf_outputs']['Insert']>
      }

      voice_notes: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          user_id: string
          audio_url: string
          duration_sec: number | null
          transcript: string | null
          ai_summary: string | null
          ai_action_items: Json | null
          ai_linked_to: string | null
          created_brief_id: string | null
          created_task_id: string | null
          created_event_id: string | null
          status: VoiceNoteStatus
          recorded_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['voice_notes']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['voice_notes']['Insert']>
      }

      itinerary_sessions: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          title: string | null
          planned_date: string
          status: ItineraryStatus
          optimized_order: string[] | null
          total_distance_km: number | null
          estimated_duration_min: number | null
          actual_start_at: string | null
          actual_end_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['itinerary_sessions']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['itinerary_sessions']['Insert']>
      }

      itinerary_stops: {
        Row: {
          id: string
          tenant_id: string
          session_id: string
          entity_id: string | null
          stop_order: number
          planned_arrival: string | null
          planned_duration_min: number | null
          actual_arrival: string | null
          actual_departure: string | null
          status: StopStatus
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['itinerary_stops']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['itinerary_stops']['Insert']>
      }

      interventions: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string
          stop_id: string | null
          user_id: string
          intervention_type: string
          title: string
          description: string | null
          started_at: string | null
          ended_at: string | null
          duration_min: number | null
          outcome: string | null
          status: InterventionStatus
          report_text: string | null
          voice_note_id: string | null
          pdf_output_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['interventions']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['interventions']['Insert']>
      }

      billing_documents: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          doc_type: BillingDocType
          number: string
          title: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          currency: string
          lines: Json
          issued_at: string | null
          due_at: string | null
          paid_at: string | null
          payment_status: PaymentStatus
          stripe_pi_id: string | null
          pdf_output_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['billing_documents']['Row'], 'id' | 'number' | 'created_at' | 'updated_at'> & { id?: string; number?: string }
        Update: Partial<Database['public']['Tables']['billing_documents']['Insert']>
      }

      tenant_config: {
        Row: {
          id: string
          tenant_id: string
          module_acquisition: boolean
          module_crm: boolean
          module_onboarding: boolean
          module_documents: boolean
          module_regulations: boolean
          module_pdf: boolean
          module_voice: boolean
          module_itinerary: boolean
          module_billing: boolean
          vocab: Json
          notif_expiry_days: number[]
          notif_email: boolean
          notif_push: boolean
          routing_engine: RoutingEngine | null
          default_start_address: string | null
          pdf_header_html: string | null
          pdf_footer_html: string | null
          theme: Json | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenant_config']['Row'], 'id' | 'updated_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['tenant_config']['Insert']>
      }

      reminders: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          document_id: string | null
          certification_id: string | null
          user_id: string | null
          title: string
          body: string | null
          remind_at: string
          channel: ReminderChannel
          status: ReminderStatus
          sent_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
      }
    }

    Views: { [_ in never]: never }

    Functions: {
      current_tenant_id: { Args: Record<PropertyKey, never>; Returns: string }
      is_member_of: { Args: { tid: string }; Returns: boolean }
      member_role: { Args: { tid: string }; Returns: MemberRole }
    }

    Enums: { [_ in never]: never }
  }
}
