-- =============================================================================
-- GENIO CORE — Migration vers le schéma multi-tenant
-- Remplace le modèle workspace/profiles/employees par tenants/memberships/entities
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Nettoyage ancien schéma
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.notifications cascade;
drop table if exists public.employee_onboarding_steps cascade;
drop table if exists public.employee_documents cascade;
drop table if exists public.employees cascade;
drop table if exists public.profiles cascade;
drop table if exists public.workspaces cascade;

drop type if exists public.app_role cascade;
drop type if exists public.onboarding_status cascade;
drop type if exists public.document_status cascade;
drop type if exists public.onboarding_step_status cascade;

-- ---------------------------------------------------------------------------
-- 2. Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------------
-- 3. PLATEFORME — Plans, Tenants, Revendeurs
-- ---------------------------------------------------------------------------

create table public.plans (
  id            uuid primary key default uuid_generate_v4(),
  slug          text not null unique,
  name          text not null,
  price_monthly numeric(10,2) not null default 0,
  price_yearly  numeric(10,2) not null default 0,
  max_users     int  not null default 1,
  max_entities  int  not null default 20,
  max_storage_gb numeric(6,2) not null default 1,
  features      jsonb not null default '[]',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.resellers (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,
  contact_email     text not null,
  stripe_account_id text,
  commission_pct    numeric(5,2) not null default 20.00,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table public.tenants (
  id                uuid primary key default uuid_generate_v4(),
  plan_id           uuid not null references public.plans(id),
  name              text not null,
  slug              text not null unique,
  vertical          text not null default 'rh',
  stripe_customer_id text,
  stripe_sub_id     text,
  sub_status        text not null default 'trialing',
  trial_ends_at     timestamptz,
  -- White-label
  wl_reseller_id    uuid references public.resellers(id),
  wl_brand_name     text,
  wl_logo_url       text,
  wl_primary_color  text,
  wl_accent_color   text,
  wl_domain         text,
  -- Localisation
  country           text not null default 'FR',
  timezone          text not null default 'Europe/Paris',
  locale            text not null default 'fr',
  -- Facturation
  address_line1     text,
  address_line2     text,
  city              text,
  postal_code       text,
  siret             text,
  vat_number        text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. IDENTITÉ — Profiles, Memberships
-- ---------------------------------------------------------------------------

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  phone      text,
  locale     text default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member',
  is_active  boolean not null default true,
  invited_by uuid references auth.users(id),
  joined_at  timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 5. ENTITÉS — CRM universel polymorphe
-- ---------------------------------------------------------------------------

create table public.entities (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  entity_type     text not null,
  ref_number      text,
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  birth_date      date,
  gender          text,
  nationality     text,
  address_line1   text,
  address_line2   text,
  city            text,
  postal_code     text,
  country         text default 'FR',
  status          text not null default 'active',
  lifecycle_stage text,
  assigned_to     uuid references auth.users(id),
  metadata        jsonb not null default '{}',
  tags            text[] not null default '{}',
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz
);

create table public.entity_relations (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  from_entity   uuid not null references public.entities(id) on delete cascade,
  to_entity     uuid not null references public.entities(id) on delete cascade,
  relation_type text not null,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

create table public.entity_events (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  entity_id   uuid not null references public.entities(id) on delete cascade,
  event_type  text not null,
  title       text,
  body        text,
  metadata    jsonb default '{}',
  occurred_at timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

-- ---------------------------------------------------------------------------
-- 6. ACQUISITION — Briefs, Pipeline, Offres
-- ---------------------------------------------------------------------------

create table public.briefs (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  title            text not null,
  description      text,
  contract_type    text,
  location         text,
  urgency          text not null default 'normal',
  voice_note_url   text,
  voice_transcript text,
  ai_structured    jsonb,
  status           text not null default 'draft',
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.job_posts (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  brief_id     uuid references public.briefs(id),
  title        text not null,
  content      text,
  status       text not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now()
);

create table public.pipeline_stages (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  entity_id  uuid not null references public.entities(id) on delete cascade,
  brief_id   uuid references public.briefs(id),
  stage      text not null default 'new',
  source     text,
  notes      text,
  score      int,
  metadata   jsonb default '{}',
  moved_at   timestamptz not null default now(),
  moved_by   uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. GESTION — Onboarding, Checklists, Tâches
-- ---------------------------------------------------------------------------

create table public.checklist_templates (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  description text,
  vertical    text,
  role_target text,
  items       jsonb not null default '[]',
  is_default  boolean default false,
  created_at  timestamptz not null default now()
);

create table public.onboardings (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  entity_id       uuid not null references public.entities(id) on delete cascade,
  template_id     uuid references public.checklist_templates(id),
  title           text not null,
  start_date      date,
  end_date        date,
  trial_end_date  date,
  status          text not null default 'in_progress',
  completion_pct  int not null default 0,
  assigned_to     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.onboarding_tasks (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  onboarding_id uuid not null references public.onboardings(id) on delete cascade,
  key           text,
  title         text not null,
  description   text,
  category      text,
  priority      int not null default 0,
  due_date      date,
  completed_at  timestamptz,
  completed_by  uuid references auth.users(id),
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. DOCUMENTS — Coffre, Signatures, OCR
-- ---------------------------------------------------------------------------

create table public.documents (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  entity_id            uuid references public.entities(id),
  doc_type             text not null,
  name                 text not null,
  file_path            text not null,
  file_size_kb         int,
  mime_type            text,
  ocr_text             text,
  ai_summary           text,
  ai_extracted         jsonb,
  issued_at            date,
  expires_at           date,
  expiry_alerted       boolean default false,
  signature_status     text,
  docusign_envelope_id text,
  signed_at            timestamptz,
  uploaded_by          uuid references auth.users(id),
  is_verified          boolean default false,
  verified_by          uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table public.expiry_alerts (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  entity_id     uuid references public.entities(id),
  document_id   uuid references public.documents(id),
  regulation_id uuid,
  alert_type    text not null,
  label         text not null,
  expires_at    date not null,
  days_until    int,
  status        text not null default 'pending',
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. RÉGLEMENTATION — Habilitations, Formations, Conformité
-- ---------------------------------------------------------------------------

create table public.regulations (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid references public.tenants(id),
  vertical      text,
  code          text not null,
  name          text not null,
  description   text,
  validity_days int,
  is_mandatory  boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.certifications (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  entity_id     uuid not null references public.entities(id) on delete cascade,
  regulation_id uuid references public.regulations(id),
  code          text,
  name          text not null,
  document_id   uuid references public.documents(id),
  obtained_at   date,
  expires_at    date,
  issuer        text,
  status        text not null default 'valid',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.formations (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  entity_id     uuid not null references public.entities(id) on delete cascade,
  regulation_id uuid references public.regulations(id),
  title         text not null,
  provider      text,
  scheduled_at  date,
  completed_at  date,
  expires_at    date,
  duration_h    numeric(5,1),
  cost          numeric(10,2),
  document_id   uuid references public.documents(id),
  status        text not null default 'planned',
  created_at    timestamptz not null default now()
);

create table public.compliance_scores (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  entity_id     uuid not null references public.entities(id) on delete cascade,
  score         int not null default 0,
  missing_docs  int not null default 0,
  expiring_soon int not null default 0,
  overdue       int not null default 0,
  details       jsonb default '{}',
  computed_at   timestamptz not null default now(),
  unique (tenant_id, entity_id)
);

-- ---------------------------------------------------------------------------
-- 10. PRODUCTION PDF
-- ---------------------------------------------------------------------------

create table public.pdf_templates (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid references public.tenants(id),
  vertical      text,
  slug          text not null,
  name          text not null,
  description   text,
  template_html text not null,
  variables     jsonb default '[]',
  is_active     boolean default true,
  version       int not null default 1,
  created_at    timestamptz not null default now()
);

create table public.pdf_outputs (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  template_id   uuid references public.pdf_templates(id),
  entity_id     uuid references public.entities(id),
  title         text not null,
  file_path     text,
  data_snapshot jsonb not null default '{}',
  status        text not null default 'pending',
  generated_at  timestamptz,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 11. TERRAIN NOMADE — Notes vocales, Itinéraires, Interventions
-- ---------------------------------------------------------------------------

create table public.voice_notes (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  entity_id         uuid references public.entities(id),
  user_id           uuid not null references auth.users(id),
  audio_url         text not null,
  duration_sec      int,
  transcript        text,
  ai_summary        text,
  ai_action_items   jsonb default '[]',
  ai_linked_to      text,
  created_brief_id  uuid references public.briefs(id),
  created_task_id   uuid references public.onboarding_tasks(id),
  created_event_id  uuid references public.entity_events(id),
  status            text not null default 'processing',
  recorded_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create table public.itinerary_sessions (
  id                     uuid primary key default uuid_generate_v4(),
  tenant_id              uuid not null references public.tenants(id) on delete cascade,
  user_id                uuid not null references auth.users(id),
  title                  text,
  planned_date           date not null,
  status                 text not null default 'draft',
  optimized_order        uuid[] default '{}',
  total_distance_km      numeric(8,2),
  estimated_duration_min int,
  actual_start_at        timestamptz,
  actual_end_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.itinerary_stops (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade,
  session_id           uuid not null references public.itinerary_sessions(id) on delete cascade,
  entity_id            uuid references public.entities(id),
  stop_order           int not null,
  planned_arrival      timestamptz,
  planned_duration_min int,
  actual_arrival       timestamptz,
  actual_departure     timestamptz,
  status               text not null default 'pending',
  notes                text,
  created_at           timestamptz not null default now()
);

create table public.interventions (
  id                 uuid primary key default uuid_generate_v4(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  entity_id          uuid not null references public.entities(id) on delete cascade,
  stop_id            uuid references public.itinerary_stops(id),
  user_id            uuid not null references auth.users(id),
  intervention_type  text not null,
  title              text not null,
  description        text,
  started_at         timestamptz,
  ended_at           timestamptz,
  duration_min       int,
  outcome            text,
  status             text not null default 'planned',
  report_text        text,
  voice_note_id      uuid references public.voice_notes(id),
  pdf_output_id      uuid references public.pdf_outputs(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 12. FACTURATION
-- ---------------------------------------------------------------------------

create table public.billing_documents (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  entity_id      uuid references public.entities(id),
  doc_type       text not null,
  number         text not null,
  title          text,
  subtotal       numeric(12,2) not null default 0,
  tax_rate       numeric(5,2)  not null default 20.00,
  tax_amount     numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  currency       text not null default 'EUR',
  lines          jsonb not null default '[]',
  issued_at      date,
  due_at         date,
  paid_at        date,
  payment_status text not null default 'pending',
  stripe_pi_id   text,
  pdf_output_id  uuid references public.pdf_outputs(id),
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, number)
);

-- ---------------------------------------------------------------------------
-- 13. CONFIG MÉTIER — Modules, Vocab, Thème
-- ---------------------------------------------------------------------------

create table public.tenant_config (
  id                   uuid primary key default uuid_generate_v4(),
  tenant_id            uuid not null references public.tenants(id) on delete cascade unique,
  -- Modules activés
  module_acquisition   boolean not null default true,
  module_crm           boolean not null default true,
  module_onboarding    boolean not null default true,
  module_documents     boolean not null default true,
  module_regulations   boolean not null default false,
  module_pdf           boolean not null default true,
  module_voice         boolean not null default false,
  module_itinerary     boolean not null default false,
  module_billing       boolean not null default false,
  -- Vocabulaire métier
  vocab                jsonb not null default '{}',
  -- Notifications
  notif_expiry_days    int[] not null default '{30,14,7}',
  notif_email          boolean not null default true,
  notif_push           boolean not null default false,
  -- Itinéraire
  routing_engine       text default 'google',
  default_start_address text,
  -- PDF
  pdf_header_html      text,
  pdf_footer_html      text,
  -- Thème UI
  theme                jsonb default '{}',
  updated_at           timestamptz not null default now()
);

create table public.reminders (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  entity_id        uuid references public.entities(id),
  document_id      uuid references public.documents(id),
  certification_id uuid references public.certifications(id),
  user_id          uuid references auth.users(id),
  title            text not null,
  body             text,
  remind_at        timestamptz not null,
  channel          text not null default 'email',
  status           text not null default 'pending',
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 14. INDEX
-- ---------------------------------------------------------------------------

create index idx_entities_tenant       on public.entities(tenant_id);
create index idx_entities_type         on public.entities(tenant_id, entity_type);
create index idx_entities_status       on public.entities(tenant_id, status);
create index idx_entities_assigned     on public.entities(assigned_to);
create index idx_entities_name_search  on public.entities using gin(
  to_tsvector('french',
    coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(email,'')
  )
);
create index idx_memberships_user      on public.memberships(user_id);
create index idx_memberships_tenant    on public.memberships(tenant_id);
create index idx_pipeline_tenant       on public.pipeline_stages(tenant_id);
create index idx_pipeline_entity       on public.pipeline_stages(entity_id);
create index idx_onboardings_entity    on public.onboardings(entity_id);
create index idx_documents_tenant      on public.documents(tenant_id);
create index idx_documents_entity      on public.documents(entity_id);
create index idx_documents_expires     on public.documents(expires_at) where expires_at is not null;
create index idx_certif_expires        on public.certifications(expires_at) where expires_at is not null;
create index idx_expiry_alerts_date    on public.expiry_alerts(expires_at, status);
create index idx_reminders_due         on public.reminders(remind_at, status);
create index idx_billing_tenant        on public.billing_documents(tenant_id);
create index idx_billing_payment       on public.billing_documents(tenant_id, payment_status);

-- ---------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.plans              enable row level security;
alter table public.resellers          enable row level security;
alter table public.tenants            enable row level security;
alter table public.profiles           enable row level security;
alter table public.memberships        enable row level security;
alter table public.entities           enable row level security;
alter table public.entity_relations   enable row level security;
alter table public.entity_events      enable row level security;
alter table public.briefs             enable row level security;
alter table public.job_posts          enable row level security;
alter table public.pipeline_stages    enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.onboardings        enable row level security;
alter table public.onboarding_tasks   enable row level security;
alter table public.documents          enable row level security;
alter table public.expiry_alerts      enable row level security;
alter table public.regulations        enable row level security;
alter table public.certifications     enable row level security;
alter table public.formations         enable row level security;
alter table public.compliance_scores  enable row level security;
alter table public.pdf_templates      enable row level security;
alter table public.pdf_outputs        enable row level security;
alter table public.voice_notes        enable row level security;
alter table public.itinerary_sessions enable row level security;
alter table public.itinerary_stops    enable row level security;
alter table public.interventions      enable row level security;
alter table public.billing_documents  enable row level security;
alter table public.tenant_config      enable row level security;
alter table public.reminders          enable row level security;

-- Helpers RLS
create or replace function public.current_tenant_id()
returns uuid language sql stable as $$
  select tenant_id from public.memberships
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function public.is_member_of(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = tid and user_id = auth.uid() and is_active = true
  );
$$;

create or replace function public.member_role(tid uuid)
returns text language sql stable as $$
  select role from public.memberships
  where tenant_id = tid and user_id = auth.uid() and is_active = true
  limit 1;
$$;

-- Plans (lecture publique)
create policy "plans_public_read" on public.plans for select using (true);

-- Tenants
create policy "tenants_member_read" on public.tenants for select
  using (public.is_member_of(id));

-- Resellers (lecture publique pour les tenants white-label)
create policy "resellers_public_read" on public.resellers for select using (true);

-- Profiles
create policy "profiles_own" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- Memberships
create policy "memberships_read" on public.memberships for select
  using (public.is_member_of(tenant_id));
create policy "memberships_manage" on public.memberships for insert
  with check (public.member_role(tenant_id) in ('owner','admin'));
create policy "memberships_update" on public.memberships for update
  using (public.member_role(tenant_id) in ('owner','admin'));

-- Macro-policy par tenant (toutes les tables métier)
create policy "entities_tenant"           on public.entities           for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "entity_relations_tenant"   on public.entity_relations   for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "entity_events_tenant"      on public.entity_events      for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "briefs_tenant"             on public.briefs             for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "job_posts_tenant"          on public.job_posts          for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "pipeline_tenant"           on public.pipeline_stages    for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "checklist_tpl_tenant"      on public.checklist_templates for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "onboardings_tenant"        on public.onboardings        for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "onboarding_tasks_tenant"   on public.onboarding_tasks   for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "documents_tenant"          on public.documents          for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "expiry_alerts_tenant"      on public.expiry_alerts      for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "certifications_tenant"     on public.certifications     for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "formations_tenant"         on public.formations         for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "compliance_tenant"         on public.compliance_scores  for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "pdf_outputs_tenant"        on public.pdf_outputs        for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "voice_notes_tenant"        on public.voice_notes        for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "itinerary_sessions_tenant" on public.itinerary_sessions for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "itinerary_stops_tenant"    on public.itinerary_stops    for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "interventions_tenant"      on public.interventions      for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "billing_tenant"            on public.billing_documents  for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
create policy "reminders_tenant"          on public.reminders          for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));

-- Regulations (globales + tenant)
create policy "regulations_read" on public.regulations for select
  using (tenant_id is null or public.is_member_of(tenant_id));

-- PDF templates (globaux + tenant)
create policy "pdf_tpl_read" on public.pdf_templates for select
  using (tenant_id is null or public.is_member_of(tenant_id));

-- Tenant config (lecture membres, écriture owner/admin)
create policy "tenant_config_read" on public.tenant_config for select
  using (public.is_member_of(tenant_id));
create policy "tenant_config_write" on public.tenant_config for all
  using (public.member_role(tenant_id) in ('owner','admin'))
  with check (public.member_role(tenant_id) in ('owner','admin'));

-- ---------------------------------------------------------------------------
-- 16. TRIGGERS — updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_tenants_updated       before update on public.tenants            for each row execute function public.set_updated_at();
create trigger trg_profiles_updated      before update on public.profiles           for each row execute function public.set_updated_at();
create trigger trg_entities_updated      before update on public.entities           for each row execute function public.set_updated_at();
create trigger trg_onboardings_updated   before update on public.onboardings        for each row execute function public.set_updated_at();
create trigger trg_documents_updated     before update on public.documents          for each row execute function public.set_updated_at();
create trigger trg_certif_updated        before update on public.certifications     for each row execute function public.set_updated_at();
create trigger trg_interventions_updated before update on public.interventions      for each row execute function public.set_updated_at();
create trigger trg_billing_updated       before update on public.billing_documents  for each row execute function public.set_updated_at();
create trigger trg_itinerary_updated     before update on public.itinerary_sessions for each row execute function public.set_updated_at();
create trigger trg_config_updated        before update on public.tenant_config      for each row execute function public.set_updated_at();
create trigger trg_briefs_updated        before update on public.briefs             for each row execute function public.set_updated_at();

-- Trigger : création automatique du profil après signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger : numérotation automatique des documents de facturation
create or replace function public.generate_billing_number()
returns trigger language plpgsql as $$
declare
  prefix text;
  year   text;
  seq    int;
begin
  prefix := case new.doc_type
    when 'quote'       then 'DEV'
    when 'invoice'     then 'FACT'
    when 'credit_note' then 'AVOIR'
    else 'DOC'
  end;
  year := to_char(now(), 'YYYY');
  select coalesce(max(cast(split_part(number, '-', 3) as int)), 0) + 1
    into seq
    from public.billing_documents
   where tenant_id = new.tenant_id
     and doc_type  = new.doc_type
     and number like prefix || '-' || year || '-%';
  new.number := prefix || '-' || year || '-' || lpad(seq::text, 4, '0');
  return new;
end;
$$;

create trigger trg_billing_number
  before insert on public.billing_documents
  for each row when (new.number is null or new.number = '')
  execute function public.generate_billing_number();

-- ---------------------------------------------------------------------------
-- 17. SEED — Plans + Réglementations de base
-- ---------------------------------------------------------------------------

insert into public.plans (slug, name, price_monthly, price_yearly, max_users, max_entities, features) values
  ('free',     'Gratuit',  0,    0,    1,   20,   '["crm","onboarding","documents"]'),
  ('starter',  'Starter',  29,   290,  5,   50,   '["crm","onboarding","documents","acquisition","voice"]'),
  ('pro',      'Pro',      79,   790,  20,  150,  '["crm","onboarding","documents","acquisition","voice","regulations","pdf","itinerary"]'),
  ('business', 'Business', 249,  2490, 999, 9999, '["all"]');

insert into public.regulations (code, name, description, validity_days, is_mandatory) values
  ('SST',             'Sauveteur Secouriste du Travail',   'Formation SST obligatoire',         730,  true),
  ('CACES_1',         'CACES R489 Cat. 1',                 'Chariots élévateurs cat. 1',        1825, true),
  ('CACES_3',         'CACES R489 Cat. 3',                 'Chariots élévateurs cat. 3',        1825, true),
  ('HABILITATION_B1', 'Habilitation électrique B1',        'Travaux hors tension BT',           1095, true),
  ('VISITE_MEDICALE', 'Visite médicale',                   'Visite médicale du travail',        730,  true),
  ('ORDINEM',         'Inscription Ordre Infirmiers',      'Inscription annuelle ONII',         365,  true),
  ('ADELI',           'Numéro ADELI',                      'Identifiant professionnel santé',   null, true),
  ('QUALIOPI',        'Certification Qualiopi',            'Certification qualité formation',   1095, true);
