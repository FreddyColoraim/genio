-- =============================================================================
-- GENIO CORE — Migration vers le schéma multi-tenant
-- Remplace le modèle workspace/profiles/employees par tenants/memberships/entities
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Nettoyage ancien schéma
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.generate_billing_number() cascade;
drop function if exists public.current_tenant_id() cascade;
drop function if exists public.is_member_of(uuid) cascade;
drop function if exists public.member_role(uuid) cascade;

-- Ancien schéma
drop table if exists public.notifications cascade;
drop table if exists public.employee_onboarding_steps cascade;
drop table if exists public.employee_documents cascade;
drop table if exists public.employees cascade;
drop table if exists public.workspaces cascade;

-- Nouveau schéma GeniO (idempotence si migration partielle)
drop table if exists public.reminders cascade;
drop table if exists public.tenant_config cascade;
drop table if exists public.billing_documents cascade;
drop table if exists public.interventions cascade;
drop table if exists public.itinerary_stops cascade;
drop table if exists public.itinerary_sessions cascade;
drop table if exists public.voice_notes cascade;
drop table if exists public.pdf_outputs cascade;
drop table if exists public.pdf_templates cascade;
drop table if exists public.compliance_scores cascade;
drop table if exists public.formations cascade;
drop table if exists public.certifications cascade;
drop table if exists public.regulations cascade;
drop table if exists public.expiry_alerts cascade;
drop table if exists public.documents cascade;
drop table if exists public.onboarding_tasks cascade;
drop table if exists public.onboardings cascade;
drop table if exists public.checklist_templates cascade;
drop table if exists public.pipeline_stages cascade;
drop table if exists public.job_posts cascade;
drop table if exists public.briefs cascade;
drop table if exists public.entity_events cascade;
drop table if exists public.entity_relations cascade;
drop table if exists public.entities cascade;
drop table if exists public.memberships cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;
drop table if exists public.resellers cascade;
drop table if exists public.plans cascade;

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
  (coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(email,'')) gin_trgm_ops
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
-- =============================================================================
-- GENIO CORE — Dimension internationale & RGPD
-- Extends tenant_config + ajoute les tables de conformité RGPD
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extension tenant_config — localisation & RGPD
-- ---------------------------------------------------------------------------

alter table public.tenant_config
  add column if not exists supported_locales  text[]   not null default '{fr}',
  add column if not exists default_currency   text     not null default 'EUR',
  add column if not exists date_format        text     not null default 'DD/MM/YYYY',
  add column if not exists gdpr_dpa_signed_at timestamptz,
  add column if not exists gdpr_dpa_name      text,
  add column if not exists data_retention_days int     not null default 2555; -- 7 ans

-- ---------------------------------------------------------------------------
-- TVA par pays — référentiel européen
-- ---------------------------------------------------------------------------

create table public.vat_rates (
  id            uuid primary key default uuid_generate_v4(),
  country_code  text not null,              -- 'FR' | 'DE' | 'ES' | 'IT' | 'NL' | ...
  country_name  text not null,
  standard_rate numeric(5,2) not null,      -- ex: 20.00
  reduced_rate  numeric(5,2),               -- ex: 5.50 (alimentaire FR)
  currency_code text not null default 'EUR',
  stripe_region text not null default 'eu', -- 'eu' | 'uk'
  sepa_enabled  boolean not null default true,
  is_eu_member  boolean not null default true,
  created_at    timestamptz not null default now()
);

insert into public.vat_rates (country_code, country_name, standard_rate, reduced_rate, currency_code, stripe_region, sepa_enabled, is_eu_member) values
  ('FR', 'France',         20.00, 5.50,  'EUR', 'eu', true,  true),
  ('DE', 'Deutschland',    19.00, 7.00,  'EUR', 'eu', true,  true),
  ('ES', 'España',         21.00, 10.00, 'EUR', 'eu', true,  true),
  ('IT', 'Italia',         22.00, 10.00, 'EUR', 'eu', true,  true),
  ('BE', 'Belgique',       21.00, 6.00,  'EUR', 'eu', true,  true),
  ('NL', 'Nederland',      21.00, 9.00,  'EUR', 'eu', true,  true),
  ('PT', 'Portugal',       23.00, 6.00,  'EUR', 'eu', true,  true),
  ('AT', 'Österreich',     20.00, 10.00, 'EUR', 'eu', true,  true),
  ('LU', 'Luxembourg',     17.00, 8.00,  'EUR', 'eu', true,  true),
  ('IE', 'Ireland',        23.00, 9.00,  'EUR', 'eu', true,  true),
  ('PL', 'Polska',         23.00, 8.00,  'PLN', 'eu', true,  true),
  ('RO', 'România',        19.00, 9.00,  'RON', 'eu', true,  true),
  ('SE', 'Sverige',        25.00, 12.00, 'SEK', 'eu', true,  true),
  ('DK', 'Danmark',        25.00, null,  'DKK', 'eu', true,  true),
  ('NO', 'Norge',          25.00, 12.00, 'NOK', 'eu', false, false),
  ('CH', 'Schweiz',        8.10,  2.60,  'CHF', 'eu', true,  false),
  ('GB', 'United Kingdom', 20.00, 5.00,  'GBP', 'uk', false, false);

-- ---------------------------------------------------------------------------
-- RGPD — Consentements & DPA
-- ---------------------------------------------------------------------------

-- Registre des consentements utilisateurs
create table public.gdpr_consents (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid references auth.users(id),
  entity_id     uuid references public.entities(id),
  consent_type  text not null,
  -- 'marketing' | 'analytics' | 'data_processing' | 'portail_access' | 'newsletter'
  granted       boolean not null,
  ip_address    text,
  user_agent    text,
  legal_basis   text not null default 'consent',
  -- 'consent' | 'contract' | 'legal_obligation' | 'legitimate_interest'
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  expires_at    timestamptz
);

-- Demandes d'exercice des droits RGPD
create table public.gdpr_requests (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  user_id       uuid references auth.users(id),
  entity_id     uuid references public.entities(id),
  request_type  text not null,
  -- 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection'
  status        text not null default 'pending',
  -- 'pending' | 'in_progress' | 'completed' | 'refused'
  requested_at  timestamptz not null default now(),
  deadline_at   timestamptz not null default (now() + interval '30 days'),
  completed_at  timestamptz,
  response_note text,
  export_path   text                                          -- pour les demandes de portabilité
);

-- RLS
alter table public.vat_rates     enable row level security;
alter table public.gdpr_consents enable row level security;
alter table public.gdpr_requests enable row level security;

create policy "vat_rates_public_read" on public.vat_rates for select using (true);

create policy "gdpr_consents_tenant" on public.gdpr_consents for all
  using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy "gdpr_requests_tenant" on public.gdpr_requests for all
  using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

-- ---------------------------------------------------------------------------
-- Seed — réglementations européennes (complément au seed FR)
-- ---------------------------------------------------------------------------

insert into public.regulations (code, name, description, validity_days, is_mandatory, vertical) values
  -- Santé / Care (EU)
  ('DMPMD_EU',  'Données médicales — RGPD Art.9',  'Traitement données santé — base légale obligatoire', null, true,  'care'),
  ('ADE_DE',    'Ärztliche Approbation (DE)',       'Licence médicale Allemagne',                         null, true,  'care'),
  ('NMC_GB',    'NMC Registration (UK)',            'Nursing and Midwifery Council registration',         365,  true,  'care'),
  -- Vétérinaire (EU)
  ('ORDRE_VET_FR', 'Inscription Ordre Vétérinaires FR', 'Inscription annuelle Ordre National',            365,  true,  'vet'),
  ('RCPV_BE',   'RCPV Belgique',                   'Registre vétérinaires Belgique',                     365,  true,  'vet'),
  -- BTP / Craft (EU)
  ('KPIB_DE',   'Befähigungsnachweis (DE)',         'Attestation de capacité artisanale Allemagne',       null, true,  'craft'),
  ('RGE_FR',    'RGE — Reconnu Garant Environnement', 'Certification travaux efficacité énergétique',    1095, false, 'craft'),
  -- RH / Travail (EU)
  ('DUER_FR',   'Document Unique EvRP',             'Document Unique d''Évaluation des Risques',          365,  true,  'rh'),
  ('AFAS_NL',   'BHV Certificaat (NL)',             'Bedrijfshulpverlening — secourisme entreprise NL',   730,  true,  'rh'),
  ('ERSTE_DE',  'Ersthelfer-Zertifikat (DE)',       'Certificat secouriste en entreprise Allemagne',      730,  true,  'rh');
-- =============================================================================
-- VOICE NOTES — Storage bucket + RLS policies
-- Private bucket for tenant-scoped audio recordings
-- Path structure: {tenantId}/{userId}/{uuid}.{ext}
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-notes',
  'voice-notes',
  false,
  26214400,
  ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS — authenticated users can only access their own tenant+user folder
-- ---------------------------------------------------------------------------

create policy "voice notes: tenant members can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (
      select tenant_id::text
      from public.memberships
      where user_id = auth.uid()
        and is_active = true
      limit 1
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "voice notes: tenant members can read own files"
  on storage.objects for select
  using (
    bucket_id = 'voice-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (
      select tenant_id::text
      from public.memberships
      where user_id = auth.uid()
        and is_active = true
      limit 1
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "voice notes: tenant members can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'voice-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = (
      select tenant_id::text
      from public.memberships
      where user_id = auth.uid()
        and is_active = true
      limit 1
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );
-- =============================================================================
-- Migration 0007 — Secteurs métier
-- Tables : sectors · sector_document_templates · sector_roles
-- Seed   : 8 secteurs + documents réglementaires + rôles par secteur
-- =============================================================================

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE sectors (
  id             TEXT PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,
  emoji          TEXT,
  tagline        TEXT,
  color_primary  TEXT NOT NULL DEFAULT '#6366F1',
  color_secondary TEXT NOT NULL DEFAULT '#EEF2FF',
  color_accent   TEXT NOT NULL DEFAULT '#4F46E5',
  config         JSONB NOT NULL DEFAULT '{}',
  sort_order     INT  DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sector_document_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id       TEXT NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN
    ('administrative','regulatory','training','equipment','health','safety','hr')),
  title           TEXT NOT NULL,
  description     TEXT,
  regulation_ref  TEXT,
  template_action TEXT NOT NULL CHECK (template_action IN ('collect','generate','sign')),
  is_mandatory    BOOLEAN DEFAULT false,
  renewal_months  INT,          -- NULL = pas de renouvellement
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sector_roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id       TEXT NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  role_key        TEXT NOT NULL,
  label           TEXT NOT NULL,
  label_feminine  TEXT,
  description     TEXT,
  permissions     JSONB DEFAULT '[]',
  is_admin_role   BOOLEAN DEFAULT false,
  sort_order      INT DEFAULT 0,
  UNIQUE (sector_id, role_key)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE sectors                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_document_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_roles               ENABLE ROW LEVEL SECURITY;

-- Lecture publique (landing pages, wizard onboarding)
CREATE POLICY "sectors_public_read"
  ON sectors FOR SELECT USING (true);

CREATE POLICY "sector_doc_templates_public_read"
  ON sector_document_templates FOR SELECT USING (true);

CREATE POLICY "sector_roles_public_read"
  ON sector_roles FOR SELECT USING (true);

-- Écriture réservée au service_role (migrations uniquement)
CREATE POLICY "sectors_service_write"
  ON sectors FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sector_doc_templates_service_write"
  ON sector_document_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "sector_roles_service_write"
  ON sector_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX idx_sector_doc_templates_sector ON sector_document_templates(sector_id);
CREATE INDEX idx_sector_roles_sector         ON sector_roles(sector_id);

-- =============================================================================
-- SEED — Secteurs
-- =============================================================================

INSERT INTO sectors (id, slug, label, emoji, tagline, color_primary, color_secondary, color_accent, sort_order) VALUES
  ('sap',      'services-a-la-personne', 'Services à la personne',   '🏠', 'Coordonnez vos intervenants, rassurez les familles.',              '#F97316','#FED7AA','#EA580C', 1),
  ('btp',      'industrie-btp',           'Industrie & BTP',           '🏗️', 'Habilitations à jour, chantiers sécurisés.',                      '#F59E0B','#FEF3C7','#1E3A5F', 2),
  ('sante',    'sante-medico-social',     'Santé & médico-social',     '🏥', 'Dossiers professionnels conformes, équipes sereinement planifiées.','#0EA5E9','#E0F2FE','#0284C7', 3),
  ('commerce', 'commerce-distribution',  'Commerce & distribution',   '🛒', 'Onboardez vite, fidélisez dès le premier jour.',                  '#EF4444','#FEE2E2','#DC2626', 4),
  ('asso',     'associations',           'Associations',               '🤝', 'Salariés et bénévoles : une seule plateforme, zéro friction.',     '#8B5CF6','#EDE9FE','#7C3AED', 5),
  ('hotel',    'hotellerie-restauration','Hôtellerie & restauration',  '🍽️', 'Shifts couverts, équipes formées, tenues prêtes.',                '#D97706','#FEF3C7','#B45309', 6),
  ('transport','transport-logistique',   'Transport & logistique',     '🚛', 'Permis valides, conducteurs affectés, tournées assurées.',         '#2563EB','#DBEAFE','#1D4ED8', 7),
  ('tech',     'tech-startup',           'Tech & startup',             '💻', 'Onboardez vos talents comme un produit se déploie.',              '#6366F1','#EEF2FF','#4F46E5', 8);

-- =============================================================================
-- SEED — Documents spécifiques par secteur
-- =============================================================================

-- ── SAP ──────────────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('sap','regulatory', 'Extrait casier judiciaire B3',           'Obligatoire pour intervention auprès de publics vulnérables.', 'Art. L133-6 CASF',   'collect', true,  NULL, 1),
  ('sap','administrative','Diplôme ADVF / BEP Sanitaire & Social','Justificatif de qualification pour auxiliaire de vie.',       'CASF Art. L347-1',   'collect', false, NULL, 2),
  ('sap','training',   'Attestation PSC1 / SST',                  'Formation premiers secours, recyclage recommandé 24 mois.',    NULL,                  'collect', false, 24,   3),
  ('sap','administrative','Permis de conduire',                    'Nécessaire pour les tournées en véhicule.',                   NULL,                  'collect', false, NULL, 4),
  ('sap','regulatory', 'Attestation assurance véhicule',           'Assurance personnelle couvrant l''usage professionnel.',       NULL,                  'collect', false, 12,   5),
  ('sap','health',     'Fiche aptitude médicale',                  'Visite d''aptitude au poste.',                                NULL,                  'collect', true,  24,   6),
  ('sap','hr',         'Parcours d''intégration intervenant',      'Planning J1, formation interne, découverte bénéficiaires.',    NULL,                  'generate',true, NULL, 7),
  ('sap','hr',         'Charte de bientraitance',                  'Engagement du personnel envers les bénéficiaires.',            NULL,                  'sign',    true,  NULL, 8),
  ('sap','safety',     'Fiche gestes d''urgence',                  'Procédures en cas d''accident ou de malaise à domicile.',      NULL,                  'generate',true, NULL, 9);

-- ── BTP ──────────────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('btp','regulatory', 'Habilitation électrique',                  'NF C 18-510 — niveaux B0/H0 à B2V/H2V selon poste.',          'NF C 18-510',         'collect', false, 36,   1),
  ('btp','training',   'CACES',                                    'R482 engins chantier, R489 chariots, R486 PEMP.',              'Art. R4323-55 CT',    'collect', false, 60,   2),
  ('btp','training',   'SST — Sauveteur Secouriste du Travail',    'Formation secours, recyclage tous les 24 mois.',              'Art. R4224-15 CT',    'collect', false, 24,   3),
  ('btp','regulatory', 'AIPR — Travaux proximité réseaux',         'Autorisation d''Intervention à Proximité des Réseaux.',        'Décret n°2012-970',   'collect', false, 60,   4),
  ('btp','health',     'Visite médicale aptitude',                  'Suivi renforcé pour postes à risques.',                       NULL,                  'collect', true,  12,   5),
  ('btp','safety',     'Livret accueil sécurité J1',                'Consignes chantier, EPI, plan évacuation, contacts urgence.',  'Art. L4141-2 CT',     'generate',true, NULL, 6),
  ('btp','equipment',  'Fiche remise des EPI',                      'Attestation de remise des équipements de protection individuelle.','Art. R4323-95 CT','sign',    true,  NULL, 7),
  ('btp','safety',     'PPSPS / Plan de prévention',                'Plan Particulier de Sécurité et de Protection de la Santé.',  NULL,                  'collect', false, NULL, 8),
  ('btp','regulatory', 'Permis feu / travail en hauteur',           'Autorisation de travaux à risques spécifiques.',              NULL,                  'generate',false,12,   9),
  ('btp','training',   'Attestations formations obligatoires',      'Risques chimiques, amiante, travail en hauteur selon poste.', NULL,                  'collect', false, NULL,10);

-- ── SANTÉ ────────────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('sante','regulatory', 'Numéro RPPS',                            'Répertoire Partagé des Professionnels de Santé.',             'Art. R4121-1 CSP',    'collect', true,  NULL, 1),
  ('sante','administrative','Diplôme d''État',                     'Copie certifiée conforme DE (IDE, AS, IADE, IBODE, Médecin…).',NULL,                  'collect', true,  NULL, 2),
  ('sante','regulatory', 'Inscription à l''Ordre professionnel',   'Attestation d''inscription en cours de validité.',            'Art. L4112-1 CSP',    'collect', true,  12,   3),
  ('sante','health',     'Vaccinations obligatoires',               'Hépatite B, DTP, grippe saisonnière selon poste.',             'Art. L3111-4 CSP',    'collect', true,  NULL, 4),
  ('sante','health',     'Fiche d''aptitude médicale au poste',    'Médecine préventive, visite initiale puis annuelle.',          NULL,                  'collect', true,  12,   5),
  ('sante','regulatory', 'Autorisation d''exercice (hors UE)',      'Dérogation / autorisation ARS pour diplômés étrangers.',      'Art. L4111-2 CSP',    'collect', false, NULL, 6),
  ('sante','hr',         'Prise de connaissance protocoles internes','Signature attestant la lecture des protocoles de soins.',     NULL,                  'sign',    true,  NULL, 7),
  ('sante','hr',         'Engagement confidentialité données santé','RGPD santé — accès aux données patients.',                   'RGPD Art. 9',         'sign',    true,  NULL, 8),
  ('sante','hr',         'Planning roulements & astreintes',        'Cycle de travail, astreintes sur appel, gardes.',              NULL,                  'generate',true, NULL, 9);

-- ── COMMERCE ─────────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('commerce','equipment', 'Badge et tenue de travail',            'Remise badge d''accès et éléments de tenue.',                 NULL,                  'sign',    true,  NULL, 1),
  ('commerce','training',  'Attestation formation caisse',          'Formation logiciel de caisse et procédures d''encaissement.',  NULL,                  'sign',    true,  NULL, 2),
  ('commerce','hr',        'Règlement intérieur magasin',           'Règles de conduite, politique remises, gestion retours.',      NULL,                  'sign',    true,  NULL, 3),
  ('commerce','hr',        'Objectifs période d''essai',            'Objectifs commerciaux et critères d''évaluation PE.',          NULL,                  'generate',true, NULL, 4),
  ('commerce','training',  'Procédures anti-démarque inconnue',     'Formation surveillance, gestion incidents, procédure EAS.',   NULL,                  'sign',    true,  NULL, 5),
  ('commerce','regulatory','Formation RGPD données clients',        'Collecte et traitement des données clients.',                 'RGPD Art. 6',         'sign',    true,  NULL, 6),
  ('commerce','training',  'SST — Premiers secours',                'Formation secouriste, renouvellement 24 mois.',               NULL,                  'collect', false, 24,   7);

-- ── ASSOCIATIONS ─────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('asso','hr',         'Convention de bénévolat',                  'Encadrement de l''engagement bénévole (missions, durée, responsabilités).', NULL, 'sign',    true,  NULL, 1),
  ('asso','regulatory', 'Attestation assurance RC association',      'Couverture du bénévole pendant ses missions.',                NULL,                  'generate',true, 12,   2),
  ('asso','administrative','Pièce d''identité',                      'CNI ou passeport du bénévole / salarié.',                    NULL,                  'collect', true,  NULL, 3),
  ('asso','regulatory', 'Information droit au congé bénévole',       '6 jours/an pour bénévoles d''associations reconnues d''UP.', 'Loi 2017-86 ESS',     'generate',false,NULL, 4),
  ('asso','regulatory', 'Engagement RGPD membres',                   'Traitement des données personnelles des bénéficiaires.',     NULL,                  'sign',    true,  NULL, 5),
  ('asso','training',   'Attestations formations internes',          'Formation aux missions, outils et procédures de l''association.', NULL,              'collect', false, NULL, 6),
  ('asso','hr',         'Charte de compte-rendu de mission',         'Modèle de rapport de mission et fréquence attendue.',        NULL,                  'generate',false,NULL, 7);

-- ── HÔTELLERIE ───────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('hotel','training',   'Attestation formation hygiène HACCP',     'Formation hygiène alimentaire 14h obligatoire.',              'Arrêté 5 oct. 2011',  'collect', true,  NULL, 1),
  ('hotel','equipment',  'Remise tenue et badge',                    'Uniforme, badge nominatif, équipements de service.',          NULL,                  'sign',    true,  NULL, 2),
  ('hotel','administrative','Contrat saisonnier / extra',            'CDDS ou CDI Saisonnier selon convention HCR.',               'Art. L1244-2 CT',     'sign',    true,  NULL, 3),
  ('hotel','regulatory', 'Extrait casier judiciaire B3',             'Pour les postes en contact avec des mineurs.',               NULL,                  'collect', false, NULL, 4),
  ('hotel','training',   'Attestation permis de vente alcool',       'Formation vente d''alcool — responsables de débit.',          'Art. L3331-4 CSP',    'collect', false, NULL, 5),
  ('hotel','training',   'Formation allergènes alimentaires',        '14 allergènes majeurs et procédures d''information client.',  'Règl. UE 1169/2011',  'sign',    true,  NULL, 6),
  ('hotel','hr',         'Planning shifts saison',                   'Répartition des shifts, repos, HS prévisionnelles.',         NULL,                  'generate',true, NULL, 7);

-- ── TRANSPORT ────────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('transport','regulatory', 'Permis de conduire C/CE/D',           'Catégorie correspondant aux véhicules du poste.',             'Art. R221-1 CR',      'collect', true,  60,   1),
  ('transport','training',   'FIMO — Formation Initiale Minimale Obligatoire','280h obligatoires pour nouveaux conducteurs salariés.','Dir. 2003/59/CE',   'collect', true,  NULL, 2),
  ('transport','training',   'FCO — Formation Continue Obligatoire', '35h tous les 5 ans pour maintenir les droits de conduite.',   'Dir. 2003/59/CE',     'collect', true,  60,   3),
  ('transport','regulatory', 'Carte conducteur numérique',           'Carte tachygraphe numérique, validité 5 ans.',               'Règl. CE 165/2014',   'collect', true,  60,   4),
  ('transport','health',     'Aptitude médicale permis professionnel','Visite médicale transport tous les 5 ans.',                  'Art. R221-10 CR',     'collect', true,  60,   5),
  ('transport','regulatory', 'Certificat ADR (Matières Dangereuses)','Transport matières dangereuses — si applicable.',             'ADR 2025',            'collect', false, 60,   6),
  ('transport','equipment',  'Fiche véhicule affecté',               'Immatriculation, état, km initial, équipements embarqués.',  NULL,                  'generate',true, NULL, 7),
  ('transport','hr',         'Règlement intérieur transport',         'Procédures temps de conduite, repos, incidents.',            'Règl. CE 561/2006',   'sign',    true,  NULL, 8);

-- ── TECH ─────────────────────────────────────────────────────────────────────
INSERT INTO sector_document_templates (sector_id, category, title, description, regulation_ref, template_action, is_mandatory, renewal_months, sort_order) VALUES
  ('tech','hr',         'NDA — Accord de confidentialité',          'Non-disclosure agreement code, données, stratégie.',          NULL,                  'sign',    true,  NULL, 1),
  ('tech','hr',         'Charte informatique & sécurité',            'Utilisation outils, politique mots de passe, BYOD.',          NULL,                  'sign',    true,  NULL, 2),
  ('tech','equipment',  'Setup stack SaaS',                          'Outils à provisionner : Slack, GitHub, Notion, Figma…',       NULL,                  'generate',true, NULL, 3),
  ('tech','hr',         'OKRs 30/60/90 jours',                      'Objectifs et indicateurs de succès pour les 3 premiers mois.',NULL,                  'generate',true, NULL, 4),
  ('tech','hr',         'Buddy pairing letter',                      'Désignation officielle du buddy, périmètre et durée.',       NULL,                  'generate',false,NULL, 5),
  ('tech','training',   'Formation RGPD développeur',                'Privacy by design, données personnelles dans le code.',       'RGPD Art. 25',        'sign',    true,  NULL, 6),
  ('tech','hr',         'Rétro onboarding 30 jours',                 'Feedback structuré après le premier mois.',                  NULL,                  'generate',false,NULL, 7);

-- =============================================================================
-- SEED — Rôles par secteur
-- =============================================================================

-- ── SAP ──────────────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('sap','coordinator',    'Coordinateur RH',         'Coordinatrice RH',         'Gère les intervenants, planifie les tournées et suit les dossiers.',  '["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('sap','sector_manager', 'Responsable de secteur',  'Responsable de secteur',   'Supervise un groupe d''intervenants sur une zone géographique.',       '["members:read","members:write","documents:read"]',                     false, 2),
  ('sap','caregiver',      'Intervenant à domicile',  'Intervenante à domicile',  'Effectue les interventions auprès des bénéficiaires.',                '["documents:read"]',                                                    false, 3),
  ('sap','quality_manager','Responsable qualité',     'Responsable qualité',      'Suit les certifications, évaluations et conformité.',                 '["members:read","documents:read","analytics:read"]',                    false, 4);

-- ── BTP ──────────────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('btp','hr_director',    'DRH / Responsable RH',    'DRH / Responsable RH',     'Pilote recrutement, habilitations et conformité HSE.',                '["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('btp','site_manager',   'Chef de chantier',        'Cheffe de chantier',        'Encadre l''équipe sur site, vérifie EPI et habilitations.',           '["members:read","members:write","documents:read"]',                     false, 2),
  ('btp','hse_manager',    'Responsable HSE',         'Responsable HSE',           'Suit habilitations, formations et conformité sécurité.',              '["members:read","documents:write","analytics:read"]',                   false, 3),
  ('btp','operator',       'Opérateur / Compagnon',   'Opératrice / Compagnonne',  'Exécute les tâches sur chantier ou en atelier.',                      '["documents:read"]',                                                    false, 4);

-- ── SANTÉ ────────────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('sante','hr_director',     'DRH / Directeur des soins',   'DRH / Directrice des soins', 'Pilote recrutement, conformité et organisation soignante.',    '["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('sante','nursing_manager', 'Cadre de santé',              'Cadre de santé',              'Encadre une équipe soignante, plannings et compétences.',     '["members:read","members:write","documents:read","analytics:read"]',    false, 2),
  ('sante','practitioner',    'Praticien / Soignant',        'Praticienne / Soignante',     'Professionnel de santé diplômé d''État.',                     '["documents:read"]',                                                    false, 3),
  ('sante','medical_secretary','Secrétaire médical',         'Secrétaire médicale',         'Gestion administrative des dossiers.',                        '["documents:read"]',                                                    false, 4);

-- ── COMMERCE ─────────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('commerce','hr_director',    'DRH Réseau',              'DRH Réseau',               'Pilote recrutement et intégration sur l''ensemble des points de vente.','["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('commerce','store_manager',  'Responsable de magasin',  'Responsable de magasin',   'Gère l''équipe PV, planning et formation terrain.',                '["members:read","members:write","documents:read","analytics:read"]',    false, 2),
  ('commerce','dept_manager',   'Chef de rayon',           'Cheffe de rayon',           'Anime son périmètre et encadre les vendeurs.',                   '["members:read","documents:read"]',                                     false, 3),
  ('commerce','sales_rep',      'Vendeur / Hôte de caisse','Vendeuse / Hôtesse de caisse','Assure vente et conseil client en magasin.',                   '["documents:read"]',                                                    false, 4);

-- ── ASSOCIATIONS ─────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('asso','director',       'Directeur·trice',             'Directrice',              'Dirige l''association, valide recrutements et supervise les équipes.','["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('asso','hr_manager',     'Responsable RH / Bénévolat',  'Responsable RH / Bénévolat','Gère recrutements, conventions et suivi des membres.',           '["members:write","documents:write","analytics:read"]',                  false, 2),
  ('asso','mission_manager','Responsable de mission',      'Responsable de mission',   'Encadre bénévoles et salariés affectés à une mission.',           '["members:read","documents:read"]',                                     false, 3),
  ('asso','employee',       'Salarié·e',                   'Salariée',                 'Travaille en CDI, CDD ou alternance au sein de l''association.',   '["documents:read"]',                                                    false, 4),
  ('asso','volunteer',      'Bénévole',                    'Bénévole',                 'S''engage sur une mission sans lien de subordination.',            '["documents:read"]',                                                    false, 5);

-- ── HÔTELLERIE ───────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('hotel','hr_director',   'DRH / Directeur d''hôtel',   'DRH / Directrice d''hôtel','Pilote recrutement saisonnier, conformité et gestion RH.',        '["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('hotel','service_manager','Chef de service',            'Cheffe de service',         'Encadre cuisine, salle ou hébergement, gère les shifts.',        '["members:read","members:write","documents:read"]',                     false, 2),
  ('hotel','staff',         'Personnel de service',        'Personnelle de service',    'Serveur, cuisinier, réceptionniste, femme de chambre.',           '["documents:read"]',                                                    false, 3),
  ('hotel','seasonal',      'Saisonnier / Extra',          'Saisonnière / Extra',       'Renfort sur une saison ou un événement ponctuel.',                '["documents:read"]',                                                    false, 4);

-- ── TRANSPORT ────────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('transport','hr_director',    'DRH Transport',           'DRH Transport',            'Pilote recrutement, conformité réglementaire et gestion conducteurs.','["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('transport','depot_manager',  'Responsable de dépôt',    'Responsable de dépôt',     'Gère équipes dépôt, planifie tournées et vérifie conformités.',   '["members:read","members:write","documents:read","analytics:read"]',    false, 2),
  ('transport','driver',         'Conducteur / Chauffeur',  'Conductrice / Chauffeuse', 'Effectue transports et livraisons selon les règles du CTR.',     '["documents:read"]',                                                    false, 3),
  ('transport','logistics_agent','Agent logistique',        'Agente logistique',        'Gère opérations en dépôt : préparation, chargement, inventaire.','["documents:read"]',                                                    false, 4);

-- ── TECH ─────────────────────────────────────────────────────────────────────
INSERT INTO sector_roles (sector_id, role_key, label, label_feminine, description, permissions, is_admin_role, sort_order) VALUES
  ('tech','head_of_people',      'Head of People',           'Head of People',           'Pilote culture, recrutement et expérience collaborateur.',       '["members:write","documents:write","analytics:read","settings:write"]', true,  1),
  ('tech','engineering_manager', 'Engineering Manager',      'Engineering Manager',      'Encadre une squad, définit OKRs et assure la montée en comp.',   '["members:read","members:write","documents:read","analytics:read"]',    false, 2),
  ('tech','developer',           'Développeur / Designer / PM','Développeuse / Designer / PM','Talent en poste dans une squad produit ou engineering.',    '["documents:read"]',                                                    false, 3),
  ('tech','buddy',               'Buddy d''intégration',     'Buddy d''intégration',     'Accompagne le nouveau talent dans ses premières semaines.',      '["members:read","documents:read"]',                                     false, 4);

-- ── Commentaire de fin ───────────────────────────────────────────────────────
-- Pour ajouter un secteur via l'admin :
--   1. INSERT INTO sectors (...)
--   2. INSERT INTO sector_document_templates (sector_id, ...)
--   3. INSERT INTO sector_roles (sector_id, ...)
--   4. Mettre à jour src/config/sectors.ts (TypeScript config miroir)
-- =============================================================================
-- Migration 0008 — Seed plans Nexo RH (4 niveaux)
-- =============================================================================

INSERT INTO public.plans (slug, name, price_monthly, price_yearly, max_users, max_entities, max_storage_gb, features, is_active)
VALUES
  ('starter',    'Starter',    19,  190,  1,  15,  1,
   '["onboarding","documents","basic_team","profile_settings"]'::jsonb,
   true),

  ('team',       'Équipe',     49,  490,  3,  50,  5,
   '["onboarding","documents","basic_team","full_team","new_arrivals","pipeline","briefs","export_csv","notifications","dashboard_advanced","workspace_members","profile_settings"]'::jsonb,
   true),

  ('business',   'Business',   99,  990,  10, 200, 20,
   '["onboarding","documents","basic_team","full_team","new_arrivals","pipeline","briefs","export_csv","notifications","dashboard_advanced","workspace_members","voice_notes","ai_actions","analytics","cron_reminders","profile_settings"]'::jsonb,
   true),

  ('enterprise', 'Entreprise', 249, 2490, -1, -1,  100,
   '["onboarding","documents","basic_team","full_team","new_arrivals","pipeline","briefs","export_csv","notifications","dashboard_advanced","workspace_members","voice_notes","ai_actions","analytics","cron_reminders","profile_settings"]'::jsonb,
   true)

ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly  = EXCLUDED.price_yearly,
  max_users     = EXCLUDED.max_users,
  max_entities  = EXCLUDED.max_entities,
  max_storage_gb= EXCLUDED.max_storage_gb,
  features      = EXCLUDED.features,
  is_active     = EXCLUDED.is_active;

-- Plan par défaut pour les nouveaux tenants en trial
-- (à utiliser dans le signup action : plan_id = SELECT id FROM plans WHERE slug = 'starter')
