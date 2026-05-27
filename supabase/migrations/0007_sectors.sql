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
