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
