-- Corrix Dashboard - Consolidated Supabase Migration
-- Generated: 2024-12-22
-- This migration creates all tables required for the Corrix Dashboard

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Users (pseudonymous - no PII)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  anonymous_id TEXT NOT NULL UNIQUE,
  privacy_tier TEXT CHECK (privacy_tier IN ('local', 'research', 'cohort')) DEFAULT 'research',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments within organizations
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Role definitions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  category VARCHAR(50) CHECK (category IN (
    'technical', 'analytical', 'creative', 'managerial',
    'operational', 'strategic', 'other'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- ============================================================================
-- Behavioral Data Tables
-- ============================================================================

-- Behavioral Signals (tier 2 - no conversation content)
CREATE TABLE behavioral_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,

  -- Platform
  platform TEXT CHECK (platform IN ('claude', 'chatgpt', 'gemini', 'other')),

  -- Prompt quality signals
  prompt_has_context BOOLEAN,
  prompt_has_constraints BOOLEAN,
  prompt_has_examples BOOLEAN,
  prompt_has_format_spec BOOLEAN,
  prompt_quality_score INTEGER CHECK (prompt_quality_score >= 0 AND prompt_quality_score <= 100),
  prompt_word_count INTEGER,

  -- Action signals
  action_type TEXT CHECK (action_type IN ('accept', 'edit', 'copy', 'regenerate', 'abandon')),
  time_to_action_seconds REAL,

  -- Session signals
  conversation_depth INTEGER,
  is_follow_up BOOLEAN,
  has_verification_request BOOLEAN,
  has_pushback BOOLEAN,
  has_clarification_request BOOLEAN,
  outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5),

  -- Session context
  session_duration_seconds INTEGER,
  session_start_hour INTEGER CHECK (session_start_hour >= 0 AND session_start_hour <= 23),

  -- Phase 2 additions
  first_attempt_success BOOLEAN,
  error_recovery_time INTEGER,
  edit_ratio DECIMAL(5,4),
  fatigue_score DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregated scores
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Main score
  corrix_score INTEGER CHECK (corrix_score >= 0 AND corrix_score <= 100),

  -- 3Rs scores
  results_score INTEGER CHECK (results_score >= 0 AND results_score <= 100),
  relationship_score INTEGER CHECK (relationship_score >= 0 AND relationship_score <= 100),
  resilience_score INTEGER CHECK (resilience_score >= 0 AND resilience_score <= 100),

  -- Results sub-components
  results_outcome_satisfaction REAL,
  results_edit_ratio REAL,
  results_task_completion REAL,

  -- Relationship sub-components
  relationship_prompt_quality REAL,
  relationship_verification_rate REAL,
  relationship_dialogue_depth REAL,
  relationship_critical_engagement REAL,

  -- Resilience sub-components
  resilience_skill_trajectory REAL,
  resilience_error_recovery REAL,
  resilience_adaptation REAL,

  -- Aggregation metadata
  signal_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- ============================================================================
-- Temporal Indicators
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE indicator_temporality AS ENUM ('leading', 'concurrent', 'lagging');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE temporal_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  indicator_name VARCHAR(100) NOT NULL,
  dimension VARCHAR(20) NOT NULL CHECK (dimension IN ('results', 'relationship', 'resilience')),
  temporality indicator_temporality NOT NULL,

  current_value DECIMAL(8,4),
  baseline_value DECIMAL(8,4),
  population_value DECIMAL(8,4),

  deviation_from_baseline DECIMAL(8,4),
  deviation_from_population DECIMAL(8,4),
  percentile_rank DECIMAL(5,2),

  trend_direction VARCHAR(10) CHECK (trend_direction IN ('improving', 'declining', 'stable')),
  trend_velocity DECIMAL(8,4),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, indicator_name)
);

CREATE TABLE indicator_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  dimension VARCHAR(20) NOT NULL,
  temporality indicator_temporality NOT NULL,

  source_table VARCHAR(100) NOT NULL,
  source_column VARCHAR(100) NOT NULL,
  aggregation_method VARCHAR(20) DEFAULT 'avg',

  warning_threshold_low DECIMAL(8,4),
  warning_threshold_high DECIMAL(8,4),
  critical_threshold_low DECIMAL(8,4),
  critical_threshold_high DECIMAL(8,4),

  display_order INTEGER DEFAULT 0,
  color_scheme VARCHAR(50) DEFAULT 'blue',
  icon VARCHAR(50),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Skill Tracking
-- ============================================================================

CREATE TABLE skill_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  overall_skill_score DECIMAL(5,2),
  skill_prompt_engineering DECIMAL(5,2),
  skill_output_evaluation DECIMAL(5,2),
  skill_verification DECIMAL(5,2),
  skill_iteration DECIMAL(5,2),
  skill_adaptation DECIMAL(5,2),
  skill_critical_thinking DECIMAL(5,2),

  trajectory_score DECIMAL(5,2),
  trajectory_direction VARCHAR(15) CHECK (trajectory_direction IN ('accelerating', 'steady', 'plateauing', 'declining')),
  days_since_improvement INTEGER,

  percentile_in_org DECIMAL(5,2),
  percentile_in_role DECIMAL(5,2),
  percentile_in_department DECIMAL(5,2),

  sessions_in_period INTEGER,
  interactions_in_period INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE competency_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'first_interaction', 'reached_baseline', 'reached_competent',
    'reached_proficient', 'reached_expert', 'skill_milestone',
    'streak_milestone', 'improvement_milestone'
  )),

  milestone_name VARCHAR(100),
  milestone_value DECIMAL(8,4),
  previous_value DECIMAL(8,4),

  days_since_first_use INTEGER,
  total_sessions INTEGER,
  total_interactions INTEGER,

  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_velocity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  velocity_7d DECIMAL(8,4),
  velocity_14d DECIMAL(8,4),
  velocity_30d DECIMAL(8,4),
  velocity_90d DECIMAL(8,4),

  acceleration DECIMAL(8,4),

  rank_in_org INTEGER,
  rank_in_team INTEGER,
  rank_in_role INTEGER,

  percentile_in_org DECIMAL(5,2),
  percentile_in_team DECIMAL(5,2)
);

-- ============================================================================
-- User Metadata
-- ============================================================================

CREATE TABLE user_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

  seniority_level VARCHAR(20) CHECK (seniority_level IN (
    'entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'
  )),

  years_in_role INTEGER,
  years_with_ai_tools INTEGER,
  primary_use_case VARCHAR(100),

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Benchmarks
-- ============================================================================

CREATE TABLE benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN (
    'global', 'organization', 'department', 'team', 'role', 'role_category'
  )),
  scope_id UUID,

  metric_name VARCHAR(100) NOT NULL,
  metric_dimension VARCHAR(20),

  mean DECIMAL(8,4) NOT NULL,
  median DECIMAL(8,4) NOT NULL,
  stddev DECIMAL(8,4),

  p10 DECIMAL(8,4),
  p25 DECIMAL(8,4),
  p50 DECIMAL(8,4),
  p75 DECIMAL(8,4),
  p90 DECIMAL(8,4),
  p95 DECIMAL(8,4),

  sample_size INTEGER NOT NULL,
  active_users INTEGER,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(scope_type, scope_id, metric_name, period_start)
);

CREATE TABLE feedback_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,

  message_index INTEGER,
  word_count INTEGER,

  specificity_score DECIMAL(5,2),
  explanation_score DECIMAL(5,2),
  constructiveness_score DECIMAL(5,2),
  actionability_score DECIMAL(5,2),

  overall_quality DECIMAL(5,2),

  has_specific_reference BOOLEAN,
  has_reasoning BOOLEAN,
  has_alternative_suggestion BOOLEAN,
  has_clear_direction BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Aggregation Tables
-- ============================================================================

CREATE TABLE score_trend_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('organization', 'team', 'user')),
  scope_id UUID NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('day', 'week', 'month')),
  period_date DATE NOT NULL,
  metric_name VARCHAR(50) NOT NULL,
  avg_value DECIMAL(10, 4) NOT NULL,
  min_value DECIMAL(10, 4),
  max_value DECIMAL(10, 4),
  sample_count INTEGER DEFAULT 0,
  change_percentage DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scope_type, scope_id, period_type, period_date, metric_name)
);

CREATE TABLE team_ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  snapshot_date DATE NOT NULL,
  rank INTEGER NOT NULL,
  previous_rank INTEGER,
  corrix_score DECIMAL(10, 4) NOT NULL,
  results_score DECIMAL(10, 4),
  relationship_score DECIMAL(10, 4),
  resilience_score DECIMAL(10, 4),
  user_count INTEGER DEFAULT 0,
  trend VARCHAR(10) CHECK (trend IN ('up', 'down', 'stable')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, team_id, snapshot_date)
);

CREATE TABLE score_distribution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('organization', 'team')),
  scope_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  metric_name VARCHAR(50) NOT NULL,
  bucket_size INTEGER DEFAULT 10,
  buckets JSONB NOT NULL,
  mean_value DECIMAL(10, 4),
  median_value DECIMAL(10, 4),
  std_dev DECIMAL(10, 4),
  p10 DECIMAL(10, 4),
  p25 DECIMAL(10, 4),
  p75 DECIMAL(10, 4),
  p90 DECIMAL(10, 4),
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scope_type, scope_id, snapshot_date, metric_name, bucket_size)
);

CREATE TABLE aggregation_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

-- ============================================================================
-- Coaching Outcomes & Targeting
-- ============================================================================

CREATE TABLE coaching_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  client_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  organization_id UUID REFERENCES organizations(id),

  coaching_type TEXT NOT NULL,
  action_taken TEXT,
  next_prompt_improved BOOLEAN,

  expertise_stage TEXT,
  domain TEXT,
  behavior_profile TEXT,
  platform TEXT,

  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE targeting_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,

  rules JSONB NOT NULL DEFAULT '[]',
  global_disabled JSONB NOT NULL DEFAULT '[]',

  created_by UUID REFERENCES users(id),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Core indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_departments_org ON departments(organization_id);
CREATE INDEX idx_roles_org ON roles(organization_id);
CREATE INDEX idx_roles_category ON roles(category);

-- Behavioral signals indexes
CREATE INDEX idx_signals_user ON behavioral_signals(user_id);
CREATE INDEX idx_signals_session ON behavioral_signals(session_id);
CREATE INDEX idx_signals_timestamp ON behavioral_signals(timestamp);
CREATE INDEX idx_signals_user_timestamp ON behavioral_signals(user_id, timestamp);

-- Daily scores indexes
CREATE INDEX idx_daily_scores_user ON daily_scores(user_id);
CREATE INDEX idx_daily_scores_date ON daily_scores(date);
CREATE INDEX idx_daily_scores_user_date ON daily_scores(user_id, date);

-- Temporal indicators indexes
CREATE INDEX idx_temporal_indicators_user_date ON temporal_indicators(user_id, date DESC);
CREATE INDEX idx_temporal_indicators_temporality ON temporal_indicators(temporality);
CREATE INDEX idx_temporal_indicators_indicator ON temporal_indicators(indicator_name);
CREATE INDEX idx_indicator_definitions_active ON indicator_definitions(is_active) WHERE is_active = true;

-- Skill tracking indexes
CREATE INDEX idx_skill_snapshots_user_date ON skill_snapshots(user_id, date DESC);
CREATE INDEX idx_skill_snapshots_trajectory ON skill_snapshots(trajectory_direction);
CREATE INDEX idx_competency_events_user ON competency_events(user_id, occurred_at DESC);
CREATE INDEX idx_competency_events_type ON competency_events(event_type);
CREATE INDEX idx_learning_velocity_user ON learning_velocity(user_id, calculated_at DESC);
CREATE INDEX idx_learning_velocity_rank ON learning_velocity(rank_in_org);

-- User metadata indexes
CREATE INDEX idx_user_metadata_dept ON user_metadata(department_id);
CREATE INDEX idx_user_metadata_role ON user_metadata(role_id);

-- Benchmarks indexes
CREATE INDEX idx_benchmarks_scope ON benchmarks(scope_type, scope_id);
CREATE INDEX idx_benchmarks_metric ON benchmarks(metric_name);
CREATE INDEX idx_benchmarks_period ON benchmarks(period_start, period_end);
CREATE INDEX idx_feedback_quality_user ON feedback_quality_scores(user_id, timestamp DESC);
CREATE INDEX idx_feedback_quality_session ON feedback_quality_scores(session_id);

-- Aggregation indexes
CREATE INDEX idx_score_trend_agg_lookup ON score_trend_aggregations(scope_type, scope_id, metric_name, period_date DESC);
CREATE INDEX idx_team_ranking_lookup ON team_ranking_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX idx_score_dist_lookup ON score_distribution_snapshots(scope_type, scope_id, snapshot_date DESC);
CREATE INDEX idx_job_logs_lookup ON aggregation_job_logs(job_name, started_at DESC);

-- Coaching indexes
CREATE INDEX coaching_outcomes_coaching_type_idx ON coaching_outcomes(coaching_type);
CREATE INDEX coaching_outcomes_user_id_idx ON coaching_outcomes(user_id);
CREATE INDEX coaching_outcomes_team_id_idx ON coaching_outcomes(team_id);
CREATE INDEX coaching_outcomes_organization_id_idx ON coaching_outcomes(organization_id);
CREATE INDEX coaching_outcomes_expertise_stage_idx ON coaching_outcomes(expertise_stage);
CREATE INDEX coaching_outcomes_domain_idx ON coaching_outcomes(domain);
CREATE INDEX coaching_outcomes_created_at_idx ON coaching_outcomes(created_at DESC);
CREATE UNIQUE INDEX targeting_config_version_idx ON targeting_config(version DESC);

-- ============================================================================
-- Materialized Views
-- ============================================================================

CREATE MATERIALIZED VIEW coaching_effectiveness AS
SELECT
  coaching_type,
  expertise_stage,
  domain,
  team_id,
  organization_id,
  COUNT(*) as total_shown,
  COUNT(*) FILTER (WHERE action_taken = 'injected_prompt') as acted_upon,
  COUNT(*) FILTER (WHERE action_taken = 'thumbs_up') as thumbs_up,
  COUNT(*) FILTER (WHERE action_taken IN ('dismissed', 'clicked_away')) as dismissed,
  COUNT(*) FILTER (WHERE action_taken = 'thumbs_down') as thumbs_down,
  COUNT(*) FILTER (WHERE next_prompt_improved = true) as improved,
  COUNT(*) FILTER (WHERE next_prompt_improved = false) as not_improved,
  CASE
    WHEN COUNT(*) > 0 THEN
      (COUNT(*) FILTER (WHERE action_taken = 'injected_prompt') +
       COUNT(*) FILTER (WHERE action_taken = 'thumbs_up'))::FLOAT / COUNT(*)
    ELSE 0
  END as effectiveness_rate,
  CASE
    WHEN COUNT(*) > 0 THEN
      COUNT(*) FILTER (WHERE action_taken IN ('dismissed', 'clicked_away'))::FLOAT / COUNT(*)
    ELSE 0
  END as dismissal_rate,
  DATE_TRUNC('day', created_at) as date
FROM coaching_outcomes
GROUP BY coaching_type, expertise_stage, domain, team_id, organization_id, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX coaching_effectiveness_unique_idx
  ON coaching_effectiveness(coaching_type, COALESCE(expertise_stage, ''), COALESCE(domain, ''), COALESCE(team_id::text, ''), COALESCE(organization_id::text, ''), date);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_scores_updated_at
  BEFORE UPDATE ON daily_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON user_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh effectiveness materialized view
CREATE OR REPLACE FUNCTION refresh_coaching_effectiveness()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY coaching_effectiveness;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Data: Indicator Definitions
-- ============================================================================

INSERT INTO indicator_definitions (name, display_name, description, dimension, temporality, source_table, source_column, display_order) VALUES
-- Leading indicators
('fatigue_level', 'Fatigue Level', 'Cognitive fatigue based on behavioral signals', 'resilience', 'leading', 'behavioral_signals', 'session_duration_seconds', 1),
('prompt_sophistication_trend', 'Prompt Sophistication Trend', 'Direction of prompt quality over recent sessions', 'relationship', 'leading', 'daily_scores', 'relationship_prompt_quality', 2),
('sustainable_pace', 'Sustainable Pace', 'Work intensity sustainability indicator', 'resilience', 'leading', 'behavioral_signals', 'session_duration_seconds', 3),
-- Concurrent indicators
('verification_depth', 'Verification Depth', 'How thoroughly outputs are being verified', 'relationship', 'concurrent', 'behavioral_signals', 'has_verification_request', 4),
('trust_calibration', 'Trust Calibration', 'Appropriateness of reliance on AI', 'relationship', 'concurrent', 'daily_scores', 'relationship_verification_rate', 5),
('error_recovery_speed', 'Error Recovery Speed', 'How quickly user recovers from AI errors', 'resilience', 'concurrent', 'behavioral_signals', 'time_to_action_seconds', 6),
('critical_engagement', 'Critical Engagement', 'Active questioning and pushback rate', 'relationship', 'concurrent', 'daily_scores', 'relationship_critical_engagement', 7),
-- Lagging indicators
('task_completion_rate', 'Task Completion Rate', 'Successfully completed interactions', 'results', 'lagging', 'daily_scores', 'results_task_completion', 8),
('output_accuracy', 'Output Accuracy', 'Quality of final outputs', 'results', 'lagging', 'daily_scores', 'results_outcome_satisfaction', 9),
('first_attempt_success', 'First Attempt Success', 'Success rate on first try', 'results', 'lagging', 'behavioral_signals', 'action_type', 10),
('learning_trajectory', 'Learning Trajectory', 'Skill improvement over time', 'resilience', 'lagging', 'daily_scores', 'resilience_skill_trajectory', 11)
ON CONFLICT (name) DO NOTHING;
