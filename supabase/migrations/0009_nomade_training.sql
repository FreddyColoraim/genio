-- =============================================================================
-- Migration 0009 — Nomade Training
-- Sessions de formation, assignments, questionnaires, réponses
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SESSIONS DE FORMATION
-- Types : product | security | procedure | regulatory | other
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS training_sessions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  type             TEXT        NOT NULL DEFAULT 'other'
                               CHECK (type IN ('product','security','procedure','regulatory','other')),
  description      TEXT,
  duration_minutes INT         DEFAULT 60,
  materials_url    TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS training_sessions_tenant_idx ON training_sessions(tenant_id);
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_training_sessions" ON training_sessions
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
  ));

-- ---------------------------------------------------------------------------
-- 2. ASSIGNMENTS ROOKIE → SESSION
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS training_assignments (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id   UUID        NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  entity_id    UUID        NOT NULL REFERENCES entities(id)          ON DELETE CASCADE,
  assigned_by  UUID        REFERENCES auth.users(id),
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  UNIQUE (session_id, entity_id)
);

CREATE INDEX IF NOT EXISTS training_assignments_tenant_idx  ON training_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS training_assignments_entity_idx  ON training_assignments(entity_id);
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_training_assignments" ON training_assignments
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
  ));

-- ---------------------------------------------------------------------------
-- 3. QUESTIONNAIRES
-- Chaque questionnaire a un access_token unique pour le lien public
-- Structure questions : JSONB array de { id, type, label, options?, correct? }
-- types de question : text | single | multiple | yesno | number
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS questionnaires (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id    UUID        REFERENCES training_sessions(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  questions     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  access_token  TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_by    UUID        REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questionnaires_tenant_idx ON questionnaires(tenant_id);
CREATE INDEX IF NOT EXISTS questionnaires_token_idx  ON questionnaires(access_token);
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_questionnaires" ON questionnaires
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
  ));

-- Lecture publique par token (pour la page /quiz/[token])
CREATE POLICY "public_read_by_token" ON questionnaires
  FOR SELECT USING (is_active = true);

-- ---------------------------------------------------------------------------
-- 4. RÉPONSES AUX QUESTIONNAIRES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  questionnaire_id  UUID        NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  entity_id         UUID        REFERENCES entities(id) ON DELETE SET NULL,
  respondent_name   TEXT,
  respondent_email  TEXT,
  answers           JSONB       NOT NULL DEFAULT '{}'::jsonb,
  score             INT,
  max_score         INT,
  pass_threshold    INT,          -- score minimum pour valider
  corrected_at      TIMESTAMPTZ,
  corrected_by      UUID        REFERENCES auth.users(id),
  correction_notes  TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questionnaire_responses_tenant_idx ON questionnaire_responses(tenant_id);
CREATE INDEX IF NOT EXISTS questionnaire_responses_quiz_idx   ON questionnaire_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS questionnaire_responses_entity_idx ON questionnaire_responses(entity_id);
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Formateurs : lire/corriger les réponses de leur tenant
CREATE POLICY "tenant_questionnaire_responses" ON questionnaire_responses
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND is_active = true
  ));

-- Insertion publique (candidat soumet ses réponses sans auth)
CREATE POLICY "public_insert_responses" ON questionnaire_responses
  FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. TRIGGER updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'training_sessions_updated_at') THEN
    CREATE TRIGGER training_sessions_updated_at
      BEFORE UPDATE ON training_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'questionnaires_updated_at') THEN
    CREATE TRIGGER questionnaires_updated_at
      BEFORE UPDATE ON questionnaires
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
