-- Migration: Create coaching outcomes table for effectiveness tracking
-- Stores coaching tip outcomes synced from Supabase for aggregated analysis

-- ============================================================================
-- coaching_outcomes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS coaching_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Client tracking
  client_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  organization_id UUID REFERENCES organizations(id),

  -- Coaching tip data
  coaching_type TEXT NOT NULL,
  action_taken TEXT,  -- 'injected_prompt', 'dismissed', 'thumbs_up', 'thumbs_down', 'clicked_away'
  next_prompt_improved BOOLEAN,

  -- Segmentation metadata
  expertise_stage TEXT,  -- 'novice', 'advanced_beginner', 'competent', 'proficient', 'expert'
  domain TEXT,
  behavior_profile TEXT,  -- 'quick_accepter', 'careful_reader', 'heavy_editor', 'iterative_refiner', 'mixed'
  platform TEXT,  -- 'claude', 'chatgpt', 'gemini', 'other'

  -- Timestamps
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS coaching_outcomes_coaching_type_idx ON coaching_outcomes(coaching_type);
CREATE INDEX IF NOT EXISTS coaching_outcomes_user_id_idx ON coaching_outcomes(user_id);
CREATE INDEX IF NOT EXISTS coaching_outcomes_team_id_idx ON coaching_outcomes(team_id);
CREATE INDEX IF NOT EXISTS coaching_outcomes_organization_id_idx ON coaching_outcomes(organization_id);
CREATE INDEX IF NOT EXISTS coaching_outcomes_expertise_stage_idx ON coaching_outcomes(expertise_stage);
CREATE INDEX IF NOT EXISTS coaching_outcomes_domain_idx ON coaching_outcomes(domain);
CREATE INDEX IF NOT EXISTS coaching_outcomes_created_at_idx ON coaching_outcomes(created_at DESC);

-- ============================================================================
-- Materialized view for aggregate effectiveness stats
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS coaching_effectiveness AS
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

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS coaching_effectiveness_unique_idx
  ON coaching_effectiveness(coaching_type, COALESCE(expertise_stage, ''), COALESCE(domain, ''), COALESCE(team_id::text, ''), COALESCE(organization_id::text, ''), date);

-- ============================================================================
-- targeting_config table for admin-controlled targeting rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS targeting_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,

  -- Targeting rules as JSON
  rules JSONB NOT NULL DEFAULT '[]',

  -- Globally disabled coaching types
  global_disabled JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  created_by UUID REFERENCES users(id),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active config version
CREATE UNIQUE INDEX IF NOT EXISTS targeting_config_version_idx ON targeting_config(version DESC);

-- ============================================================================
-- Function to refresh effectiveness materialized view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_coaching_effectiveness()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY coaching_effectiveness;
END;
$$ LANGUAGE plpgsql;
