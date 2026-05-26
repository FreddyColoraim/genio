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
  deadline_at   timestamptz not null generated always as (requested_at + interval '30 days') stored,
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
