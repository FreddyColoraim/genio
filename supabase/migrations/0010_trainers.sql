-- =============================================================================
-- Migration 0010 — Trainers (Formateurs)
-- Profils formateurs, compétences, accès portail, liaison sessions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE TRAINERS
-- access_token = lien unique portail formateur (ex: /formateur/abc123)
-- linked_user_id = optionnel : si le formateur a aussi un compte Nexo
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trainers (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  phone            TEXT,
  bio              TEXT,
  avatar_url       TEXT,
  competences      TEXT[]      NOT NULL DEFAULT '{}',   -- ex: ['sécurité incendie','produit X']
  specialties      TEXT[]      NOT NULL DEFAULT '{}',   -- ex: ['onboarding','réglementation']
  linked_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  access_token     TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS trainers_tenant_idx ON trainers(tenant_id);
CREATE INDEX IF NOT EXISTS trainers_token_idx  ON trainers(access_token);

ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Membres du tenant peuvent lire/gérer leurs formateurs
CREATE POLICY "tenant_trainers_all" ON trainers
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
  ));

-- Lecture publique par token (portail formateur sans auth)
CREATE POLICY "public_read_trainer_by_token" ON trainers
  FOR SELECT USING (is_active = true);

-- ---------------------------------------------------------------------------
-- 2. SESSION_TRAINERS — liaison many-to-many sessions ↔ formateurs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS session_trainers (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id   UUID        NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  trainer_id   UUID        NOT NULL REFERENCES trainers(id)          ON DELETE CASCADE,
  assigned_by  UUID        REFERENCES auth.users(id),
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_lead      BOOLEAN     NOT NULL DEFAULT false,  -- formateur principal vs assistant
  UNIQUE (session_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS session_trainers_session_idx ON session_trainers(session_id);
CREATE INDEX IF NOT EXISTS session_trainers_trainer_idx ON session_trainers(trainer_id);
CREATE INDEX IF NOT EXISTS session_trainers_tenant_idx  ON session_trainers(tenant_id);

ALTER TABLE session_trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_session_trainers" ON session_trainers
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
  ));

-- Lecture publique (pour portail formateur)
CREATE POLICY "public_read_session_trainers" ON session_trainers
  FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 3. TRIGGER updated_at sur trainers
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trainers_updated_at') THEN
    CREATE TRIGGER trainers_updated_at
      BEFORE UPDATE ON trainers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
