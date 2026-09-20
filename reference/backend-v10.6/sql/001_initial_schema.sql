-- COAL UP CRM V10.5
-- 001_initial_schema.sql
-- Frente 2 — COAL UP Marketing e Presença Digital
-- Banco NOVO / instalação inicial. Não é migration incremental de V7.
-- Target conservador: MySQL/MariaDB + InnoDB + utf8mb4.
-- Timestamps da aplicação: UTC.
-- Valores monetários: centavos em BIGINT UNSIGNED + currency CHAR(3).
-- IDs: UUID textual CHAR(36), gerados pela aplicação PHP.
-- JSON: armazenado em LONGTEXT e validado pela aplicação para reduzir acoplamento à versão exata do servidor.

SET NAMES utf8mb4;

CREATE TABLE schema_migrations (
  version VARCHAR(64) PRIMARY KEY,
  description VARCHAR(190) NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- AUTH / SECURITY
-- =========================================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  login VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'operator',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  auth_version INT UNSIGNED NOT NULL DEFAULT 1,
  mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret_ciphertext TEXT NULL,
  mfa_last_step BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_users_login (login),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auth_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  csrf_token_hash CHAR(64) NOT NULL,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6) NULL,
  revoke_reason VARCHAR(190) NULL,
  auth_version INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_auth_session_token (token_hash),
  KEY idx_auth_session_user (user_id, revoked_at, expires_at),
  KEY idx_auth_session_expiry (expires_at),
  CONSTRAINT fk_auth_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mfa_recovery_codes (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  used_at DATETIME(6) NULL,
  UNIQUE KEY uq_mfa_recovery_hash (user_id, code_hash),
  KEY idx_mfa_recovery_user (user_id, used_at),
  CONSTRAINT fk_mfa_recovery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- CRM CORE
-- =========================================================

CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  public_name VARCHAR(190) NULL,
  segment VARCHAR(120) NULL,
  relationship_state VARCHAR(32) NOT NULL DEFAULT 'prospect',
  origin VARCHAR(64) NULL,
  origin_detail VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  state_code VARCHAR(16) NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'BR',
  postal_code VARCHAR(20) NULL,
  address_line VARCHAR(255) NULL,
  website_url VARCHAR(500) NULL,
  instagram_handle VARCHAR(120) NULL,
  primary_contact_id CHAR(36) NULL,
  client_since DATETIME(6) NULL,
  created_by CHAR(36) NULL,
  created_source VARCHAR(32) NOT NULL DEFAULT 'crm',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_org_name (name),
  KEY idx_org_relationship (relationship_state, archived_at),
  KEY idx_org_origin (origin, created_at),
  CONSTRAINT fk_org_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contacts (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  role_title VARCHAR(120) NULL,
  email VARCHAR(190) NULL,
  email_normalized VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  phone_normalized VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  whatsapp_normalized VARCHAR(40) NULL,
  instagram_handle VARCHAR(120) NULL,
  preferred_channel VARCHAR(32) NULL,
  created_by CHAR(36) NULL,
  created_source VARCHAR(32) NOT NULL DEFAULT 'crm',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_contacts_org (organization_id, archived_at),
  KEY idx_contacts_email_norm (email_normalized),
  KEY idx_contacts_phone_norm (phone_normalized),
  KEY idx_contacts_whatsapp_norm (whatsapp_normalized),
  CONSTRAINT fk_contacts_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contacts_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE organizations
  ADD CONSTRAINT fk_org_primary_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE RESTRICT;

CREATE TABLE leads (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  primary_contact_id CHAR(36) NULL,
  owner_id CHAR(36) NULL,
  source VARCHAR(64) NULL,
  source_detail VARCHAR(255) NULL,
  qualification_state VARCHAR(32) NOT NULL DEFAULT 'new',
  problem_observed VARCHAR(1200) NULL,
  disqualification_reason VARCHAR(500) NULL,
  qualified_at DATETIME(6) NULL,
  disqualified_at DATETIME(6) NULL,
  converted_at DATETIME(6) NULL,
  created_by CHAR(36) NULL,
  created_source VARCHAR(32) NOT NULL DEFAULT 'crm',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_leads_org (organization_id, archived_at),
  KEY idx_leads_owner_state (owner_id, qualification_state, archived_at),
  KEY idx_leads_source (source, created_at),
  CONSTRAINT fk_leads_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leads_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leads_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_leads_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE opportunities (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  primary_contact_id CHAR(36) NULL,
  title VARCHAR(190) NOT NULL,
  amount_cents BIGINT UNSIGNED NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  service_label VARCHAR(190) NULL,
  owner_id CHAR(36) NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'open',
  loss_reason VARCHAR(500) NULL,
  later_until DATETIME(6) NULL,
  later_condition VARCHAR(500) NULL,
  won_at DATETIME(6) NULL,
  lost_at DATETIME(6) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_opps_org (organization_id, archived_at),
  KEY idx_opps_owner_state (owner_id, lifecycle_status, archived_at),
  KEY idx_opps_created (created_at),
  CONSTRAINT fk_opps_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_opps_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_opps_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_opps_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- FUNNEL CONFIGURATION
-- =========================================================

CREATE TABLE funnels (
  id CHAR(36) PRIMARY KEY,
  funnel_key VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(1200) NULL,
  scope VARCHAR(64) NOT NULL DEFAULT 'marketing',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  active_version_id CHAR(36) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_funnel_key (funnel_key),
  KEY idx_funnels_status (status, archived_at),
  CONSTRAINT fk_funnels_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE funnel_versions (
  id CHAR(36) PRIMARY KEY,
  funnel_id CHAR(36) NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  created_by CHAR(36) NOT NULL,
  published_by CHAR(36) NULL,
  published_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_funnel_version (funnel_id, version_number),
  KEY idx_funnel_versions_status (funnel_id, status),
  CONSTRAINT fk_fversion_funnel FOREIGN KEY (funnel_id) REFERENCES funnels(id) ON DELETE RESTRICT,
  CONSTRAINT fk_fversion_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_fversion_publisher FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE funnels
  ADD CONSTRAINT fk_funnels_active_version FOREIGN KEY (active_version_id) REFERENCES funnel_versions(id) ON DELETE RESTRICT;

CREATE TABLE funnel_stages (
  id CHAR(36) PRIMARY KEY,
  funnel_version_id CHAR(36) NOT NULL,
  stage_key VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL,
  entity_mode VARCHAR(24) NOT NULL DEFAULT 'lead',
  stage_type VARCHAR(24) NOT NULL DEFAULT 'open',
  objective VARCHAR(1200) NOT NULL,
  entry_note VARCHAR(1200) NULL,
  exit_note VARCHAR(1200) NULL,
  sla_days SMALLINT UNSIGNED NULL,
  default_next_action VARCHAR(190) NULL,
  guidance_json LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_stage_key (funnel_version_id, stage_key),
  UNIQUE KEY uq_stage_position (funnel_version_id, position),
  UNIQUE KEY uq_stage_id_version (id, funnel_version_id),
  KEY idx_stages_version_type (funnel_version_id, stage_type),
  CONSTRAINT fk_stage_version FOREIGN KEY (funnel_version_id) REFERENCES funnel_versions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE funnel_stage_requirements (
  id CHAR(36) PRIMARY KEY,
  stage_id CHAR(36) NOT NULL,
  checker_key VARCHAR(64) NOT NULL,
  label VARCHAR(190) NOT NULL,
  config_json LONGTEXT NULL,
  severity VARCHAR(24) NOT NULL DEFAULT 'advisory',
  override_allowed TINYINT(1) NOT NULL DEFAULT 1,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_stage_req (stage_id, active, position),
  CONSTRAINT fk_req_stage FOREIGN KEY (stage_id) REFERENCES funnel_stages(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- FUNNEL RUNTIME
-- =========================================================

CREATE TABLE commercial_cases (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  primary_contact_id CHAR(36) NULL,
  lead_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  owner_id CHAR(36) NULL,
  funnel_version_id CHAR(36) NOT NULL,
  current_stage_id CHAR(36) NOT NULL,
  current_stage_entered_at DATETIME(6) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  next_action_task_id CHAR(36) NULL,
  later_until DATETIME(6) NULL,
  later_condition VARCHAR(500) NULL,
  close_reason VARCHAR(500) NULL,
  opened_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  closed_at DATETIME(6) NULL,
  created_by CHAR(36) NULL,
  created_source VARCHAR(32) NOT NULL DEFAULT 'crm',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_case_lead (lead_id),
  UNIQUE KEY uq_case_opportunity (opportunity_id),
  KEY idx_case_org (organization_id, status, archived_at),
  KEY idx_case_stage (funnel_version_id, current_stage_id, status),
  KEY idx_case_owner (owner_id, status),
  KEY idx_case_aging (current_stage_id, current_stage_entered_at),
  KEY idx_case_next_action (next_action_task_id),
  CONSTRAINT fk_case_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_version FOREIGN KEY (funnel_version_id) REFERENCES funnel_versions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_stage_version FOREIGN KEY (current_stage_id, funnel_version_id) REFERENCES funnel_stages(id, funnel_version_id) ON DELETE RESTRICT,
  CONSTRAINT fk_case_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activities (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  contact_id CHAR(36) NULL,
  kind VARCHAR(32) NOT NULL,
  channel VARCHAR(32) NULL,
  occurred_at DATETIME(6) NOT NULL,
  summary VARCHAR(1200) NOT NULL,
  agreement_note VARCHAR(700) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_activities_org (organization_id, occurred_at),
  KEY idx_activities_case (commercial_case_id, occurred_at),
  KEY idx_activities_opp (opportunity_id, occurred_at),
  KEY idx_activities_kind (kind, occurred_at),
  CONSTRAINT fk_activity_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_activity_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_activity_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_activity_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_activity_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  name VARCHAR(190) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'planned',
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  due_at DATETIME(6) NULL,
  blocked_reason VARCHAR(700) NULL,
  owner_id CHAR(36) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_projects_org (organization_id, status, archived_at),
  KEY idx_projects_case (commercial_case_id, status),
  KEY idx_projects_due (status, due_at),
  CONSTRAINT fk_project_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_project_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  source_activity_id CHAR(36) NULL,
  assigned_to CHAR(36) NULL,
  created_by CHAR(36) NOT NULL,
  title VARCHAR(190) NOT NULL,
  description VARCHAR(1200) NULL,
  priority VARCHAR(16) NOT NULL DEFAULT 'normal',
  due_at DATETIME(6) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  completed_at DATETIME(6) NULL,
  completion_note VARCHAR(700) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_task_source_activity (source_activity_id),
  KEY idx_tasks_today (assigned_to, status, due_at),
  KEY idx_tasks_org (organization_id, status, due_at),
  KEY idx_tasks_case (commercial_case_id, status, due_at),
  KEY idx_tasks_opp (opportunity_id, status, due_at),
  KEY idx_tasks_project (project_id, status, due_at),
  CONSTRAINT fk_task_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_source_activity FOREIGN KEY (source_activity_id) REFERENCES activities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE commercial_cases
  ADD CONSTRAINT fk_case_next_task FOREIGN KEY (next_action_task_id) REFERENCES tasks(id) ON DELETE RESTRICT;

CREATE TABLE proposals (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  commercial_case_id CHAR(36) NOT NULL,
  opportunity_id CHAR(36) NOT NULL,
  primary_contact_id CHAR(36) NULL,
  proposal_number VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  amount_cents BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  followup_due_at DATETIME(6) NULL,
  valid_until DATETIME(6) NULL,
  snapshot_json LONGTEXT NULL,
  sent_at DATETIME(6) NULL,
  accepted_at DATETIME(6) NULL,
  rejected_at DATETIME(6) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_proposals_case (commercial_case_id, status, archived_at),
  KEY idx_proposals_followup (status, followup_due_at),
  KEY idx_proposals_org (organization_id, created_at),
  CONSTRAINT fk_proposal_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_proposal_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_proposal_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_proposal_contact FOREIGN KEY (primary_contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_proposal_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dossier_entries (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  lead_id CHAR(36) NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  category VARCHAR(48) NOT NULL,
  body TEXT NOT NULL,
  source_label VARCHAR(190) NULL,
  source_url TEXT NULL,
  observed_at DATETIME(6) NULL,
  metadata_json LONGTEXT NULL,
  created_by CHAR(36) NULL,
  created_source VARCHAR(32) NOT NULL DEFAULT 'crm',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  supersedes_id CHAR(36) NULL,
  KEY idx_dossier_org (organization_id, created_at),
  KEY idx_dossier_case (commercial_case_id, category, created_at),
  KEY idx_dossier_lead (lead_id, created_at),
  KEY idx_dossier_opp (opportunity_id, created_at),
  CONSTRAINT fk_dossier_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dossier_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dossier_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dossier_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dossier_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_dossier_supersedes FOREIGN KEY (supersedes_id) REFERENCES dossier_entries(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  contact_id CHAR(36) NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  body TEXT NOT NULL,
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_notes_org (organization_id, archived_at, created_at),
  KEY idx_notes_case (commercial_case_id, archived_at, created_at),
  KEY idx_notes_project (project_id, archived_at, created_at),
  CONSTRAINT fk_notes_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notes_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notes_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notes_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notes_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notes_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE file_assets (
  id CHAR(36) PRIMARY KEY,
  storage_key VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  sha256 CHAR(64) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  archived_at DATETIME(6) NULL,
  UNIQUE KEY uq_file_storage_key (storage_key),
  KEY idx_file_sha (sha256),
  CONSTRAINT fk_file_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE file_links (
  id CHAR(36) PRIMARY KEY,
  file_asset_id CHAR(36) NOT NULL,
  organization_id CHAR(36) NOT NULL,
  lead_id CHAR(36) NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  activity_id CHAR(36) NULL,
  task_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  proposal_id CHAR(36) NULL,
  note_id CHAR(36) NULL,
  dossier_entry_id CHAR(36) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_filelink_org (organization_id, created_at),
  KEY idx_filelink_case (commercial_case_id, created_at),
  KEY idx_filelink_project (project_id, created_at),
  CONSTRAINT fk_filelink_asset FOREIGN KEY (file_asset_id) REFERENCES file_assets(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_proposal FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_note FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_dossier FOREIGN KEY (dossier_entry_id) REFERENCES dossier_entries(id) ON DELETE RESTRICT,
  CONSTRAINT fk_filelink_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE funnel_stage_events (
  id CHAR(36) PRIMARY KEY,
  commercial_case_id CHAR(36) NOT NULL,
  funnel_version_id CHAR(36) NOT NULL,
  stage_id CHAR(36) NOT NULL,
  event_type VARCHAR(16) NOT NULL,
  counterpart_stage_id CHAR(36) NULL,
  transition_id CHAR(36) NOT NULL,
  transition_reason VARCHAR(500) NULL,
  override_reason VARCHAR(700) NULL,
  gate_snapshot_json LONGTEXT NULL,
  actor_user_id CHAR(36) NULL,
  occurred_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_stage_event_transition (transition_id, event_type, stage_id),
  KEY idx_stageevent_case (commercial_case_id, occurred_at),
  KEY idx_stageevent_stage (funnel_version_id, stage_id, occurred_at),
  KEY idx_stageevent_transition (transition_id),
  CONSTRAINT fk_stageevent_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_stageevent_stage_version FOREIGN KEY (stage_id, funnel_version_id) REFERENCES funnel_stages(id, funnel_version_id) ON DELETE RESTRICT,
  CONSTRAINT fk_stageevent_counterpart_version FOREIGN KEY (counterpart_stage_id, funnel_version_id) REFERENCES funnel_stages(id, funnel_version_id) ON DELETE RESTRICT,
  CONSTRAINT fk_stageevent_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- FINANCE / SMALL-BUSINESS OPERATION
-- =========================================================

CREATE TABLE receivables (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  commercial_case_id CHAR(36) NULL,
  opportunity_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  description VARCHAR(255) NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  due_at DATETIME(6) NOT NULL,
  lifecycle_status VARCHAR(24) NOT NULL DEFAULT 'open',
  cancelled_at DATETIME(6) NULL,
  cancellation_reason VARCHAR(500) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_receivable_due (lifecycle_status, due_at),
  KEY idx_receivable_org (organization_id, lifecycle_status, due_at),
  KEY idx_receivable_case (commercial_case_id, due_at),
  CONSTRAINT fk_receivable_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receivable_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receivable_opp FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receivable_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_receivable_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY,
  receivable_id CHAR(36) NOT NULL,
  payment_type VARCHAR(24) NOT NULL DEFAULT 'receipt',
  related_payment_id CHAR(36) NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  occurred_at DATETIME(6) NOT NULL,
  method VARCHAR(40) NULL,
  external_reference VARCHAR(190) NULL,
  idempotency_key VARCHAR(100) NULL,
  note VARCHAR(500) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_payment_idempotency (idempotency_key),
  KEY idx_payment_receivable (receivable_id, occurred_at),
  KEY idx_payment_time (payment_type, occurred_at),
  CONSTRAINT fk_payment_receivable FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_related FOREIGN KEY (related_payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE expenses (
  id CHAR(36) PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  expense_kind VARCHAR(24) NOT NULL DEFAULT 'variable',
  amount_cents BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  due_at DATETIME(6) NOT NULL,
  paid_at DATETIME(6) NULL,
  lifecycle_status VARCHAR(24) NOT NULL DEFAULT 'open',
  supplier VARCHAR(190) NULL,
  organization_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  recurrence_id CHAR(36) NULL,
  note VARCHAR(700) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_expense_due (lifecycle_status, due_at),
  KEY idx_expense_paid (paid_at),
  KEY idx_expense_category (category, paid_at),
  CONSTRAINT fk_expense_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_expense_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_expense_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE budget_periods (
  id CHAR(36) PRIMARY KEY,
  month_start DATE NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  note VARCHAR(700) NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_budget_month (month_start),
  CONSTRAINT fk_budget_period_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE budget_lines (
  id CHAR(36) PRIMARY KEY,
  budget_period_id CHAR(36) NOT NULL,
  category VARCHAR(120) NOT NULL,
  planned_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_budget_line_category (budget_period_id, category),
  KEY idx_budget_line_period (budget_period_id),
  CONSTRAINT fk_budget_line_period FOREIGN KEY (budget_period_id) REFERENCES budget_periods(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE recurrences (
  id CHAR(36) PRIMARY KEY,
  direction VARCHAR(16) NOT NULL,
  recurrence_kind VARCHAR(32) NOT NULL,
  name VARCHAR(190) NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  interval_key VARCHAR(24) NOT NULL DEFAULT 'monthly',
  organization_id CHAR(36) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATE NULL,
  ends_at DATE NULL,
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  KEY idx_recurrence_active (active, direction, recurrence_kind),
  CONSTRAINT fk_recurrence_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_recurrence_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE expenses
  ADD CONSTRAINT fk_expense_recurrence FOREIGN KEY (recurrence_id) REFERENCES recurrences(id) ON DELETE RESTRICT;

-- =========================================================
-- PUBLIC WEB BRIDGE
-- =========================================================

CREATE TABLE lead_captures (
  id CHAR(36) PRIMARY KEY,
  client_submission_id CHAR(36) NULL,
  payload_hash CHAR(64) NOT NULL,
  person_name VARCHAR(160) NOT NULL,
  business_name VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  phone_normalized VARCHAR(40) NOT NULL,
  email VARCHAR(190) NULL,
  email_normalized VARCHAR(190) NULL,
  message VARCHAR(2000) NOT NULL,
  page_url VARCHAR(500) NULL,
  cta_key VARCHAR(120) NULL,
  service_context VARCHAR(120) NULL,
  utm_source VARCHAR(190) NULL,
  utm_medium VARCHAR(190) NULL,
  utm_campaign VARCHAR(190) NULL,
  utm_content VARCHAR(190) NULL,
  utm_term VARCHAR(190) NULL,
  referrer VARCHAR(1000) NULL,
  dedupe_state VARCHAR(32) NOT NULL DEFAULT 'new',
  matched_organization_id CHAR(36) NULL,
  matched_contact_id CHAR(36) NULL,
  lead_id CHAR(36) NULL,
  commercial_case_id CHAR(36) NULL,
  rejected_reason VARCHAR(500) NULL,
  ip_hash CHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  received_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  processed_at DATETIME(6) NULL,
  UNIQUE KEY uq_capture_client_submission (client_submission_id),
  KEY idx_capture_phone (phone_normalized, received_at),
  KEY idx_capture_email (email_normalized, received_at),
  KEY idx_capture_dedupe (dedupe_state, received_at),
  KEY idx_capture_case (commercial_case_id),
  CONSTRAINT fk_capture_org FOREIGN KEY (matched_organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_capture_contact FOREIGN KEY (matched_contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_capture_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE RESTRICT,
  CONSTRAINT fk_capture_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- EVENTS / AUDIT / IDEMPOTENCY
-- =========================================================

CREATE TABLE domain_events (
  id CHAR(36) PRIMARY KEY,
  event_type VARCHAR(120) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id CHAR(36) NULL,
  organization_id CHAR(36) NULL,
  commercial_case_id CHAR(36) NULL,
  actor_user_id CHAR(36) NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'crm',
  correlation_id CHAR(36) NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  payload_json LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_domain_event_time (event_type, occurred_at),
  KEY idx_domain_event_org (organization_id, occurred_at),
  KEY idx_domain_event_case (commercial_case_id, occurred_at),
  KEY idx_domain_event_entity (entity_type, entity_id, occurred_at),
  KEY idx_domain_event_corr (correlation_id),
  CONSTRAINT fk_domain_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_domain_case FOREIGN KEY (commercial_case_id) REFERENCES commercial_cases(id) ON DELETE RESTRICT,
  CONSTRAINT fk_domain_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_events (
  id CHAR(36) PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id CHAR(36) NULL,
  summary VARCHAR(700) NOT NULL,
  result VARCHAR(24) NOT NULL DEFAULT 'success',
  request_id CHAR(36) NOT NULL,
  correlation_id CHAR(36) NULL,
  ip_hash CHAR(64) NULL,
  metadata_json LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_audit_entity (entity_type, entity_id, created_at),
  KEY idx_audit_actor (actor_id, created_at),
  KEY idx_audit_corr (correlation_id),
  KEY idx_audit_request (request_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rate_limits (
  bucket_key CHAR(64) PRIMARY KEY,
  tokens DOUBLE NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  KEY idx_rate_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mutation_keys (
  scope VARCHAR(120) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  actor_user_id CHAR(36) NULL,
  payload_hash CHAR(64) NOT NULL,
  response_code SMALLINT UNSIGNED NULL,
  result_json LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at DATETIME(6) NOT NULL,
  PRIMARY KEY (scope, idempotency_key),
  KEY idx_mutation_expiry (expires_at),
  CONSTRAINT fk_mutation_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
