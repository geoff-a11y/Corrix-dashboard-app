-- Initial schema for Corrix Dashboard
-- This creates the core tables for behavioral analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Behavioral Signals (tier 2 - no conversation content)
CREATE TABLE behavioral_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,

  -- Platform
  platform TEXT CHECK (platform IN ('claude', 'chatgpt', 'gemini', 'other')),

  -- Prompt quality signals (derived, not raw content)
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

-- Indexes for common queries
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);

CREATE INDEX idx_signals_user ON behavioral_signals(user_id);
CREATE INDEX idx_signals_session ON behavioral_signals(session_id);
CREATE INDEX idx_signals_timestamp ON behavioral_signals(timestamp);
CREATE INDEX idx_signals_user_timestamp ON behavioral_signals(user_id, timestamp);

CREATE INDEX idx_daily_scores_user ON daily_scores(user_id);
CREATE INDEX idx_daily_scores_date ON daily_scores(date);
CREATE INDEX idx_daily_scores_user_date ON daily_scores(user_id, date);

CREATE INDEX idx_teams_organization ON teams(organization_id);

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
