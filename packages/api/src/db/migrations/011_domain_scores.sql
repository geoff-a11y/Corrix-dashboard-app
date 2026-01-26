-- Domain-specific CRI scores
-- Tracks 3R scores per domain for each user

CREATE TABLE domain_daily_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  date DATE NOT NULL,

  -- Domain identification
  domain_id TEXT NOT NULL,
  domain_name TEXT NOT NULL,

  -- Scores
  overall INTEGER NOT NULL CHECK (overall >= 0 AND overall <= 100),
  results INTEGER NOT NULL CHECK (results >= 0 AND results <= 100),
  relationship INTEGER NOT NULL CHECK (relationship >= 0 AND relationship <= 100),
  resilience INTEGER NOT NULL CHECK (resilience >= 0 AND resilience <= 100),

  -- Metadata
  interaction_count INTEGER NOT NULL DEFAULT 0,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining', 'insufficient_data')) DEFAULT 'insufficient_data',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One score per user, domain, date
  UNIQUE(user_id, domain_id, date)
);

-- Indexes for querying
CREATE INDEX idx_domain_scores_user_date ON domain_daily_scores(user_id, date DESC);
CREATE INDEX idx_domain_scores_org ON domain_daily_scores(organization_id, date DESC);
CREATE INDEX idx_domain_scores_team ON domain_daily_scores(team_id, date DESC);
CREATE INDEX idx_domain_scores_domain ON domain_daily_scores(domain_id, date DESC);

-- Update trigger for updated_at
CREATE TRIGGER domain_daily_scores_updated_at
  BEFORE UPDATE ON domain_daily_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
