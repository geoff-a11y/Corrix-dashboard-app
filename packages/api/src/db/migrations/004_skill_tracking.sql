-- Migration 004: Skill Tracking
-- Adds skill snapshots, competency events, and learning velocity tracking

-- Daily skill snapshots for trajectory analysis
CREATE TABLE IF NOT EXISTS skill_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Composite skill scores
  overall_skill_score DECIMAL(5,2),

  -- Skill components (aligned with Critical Intelligence practices)
  skill_prompt_engineering DECIMAL(5,2),     -- Direction/prompting skill
  skill_output_evaluation DECIMAL(5,2),      -- Critique/evaluation skill
  skill_verification DECIMAL(5,2),           -- Scrutiny/corroboration skill
  skill_iteration DECIMAL(5,2),              -- Dialogue/refinement skill
  skill_adaptation DECIMAL(5,2),             -- Adaptability skill
  skill_critical_thinking DECIMAL(5,2),      -- Recalibration skill

  -- Trajectory metrics
  trajectory_score DECIMAL(5,2),             -- Improvement rate
  trajectory_direction VARCHAR(15) CHECK (trajectory_direction IN ('accelerating', 'steady', 'plateauing', 'declining')),
  days_since_improvement INTEGER,            -- Days since last meaningful improvement

  -- Comparison metrics
  percentile_in_org DECIMAL(5,2),
  percentile_in_role DECIMAL(5,2),
  percentile_in_department DECIMAL(5,2),

  -- Activity metrics (for context)
  sessions_in_period INTEGER,
  interactions_in_period INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Competency milestones
CREATE TABLE IF NOT EXISTS competency_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Event type
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'first_interaction',
    'reached_baseline',        -- Corrix score >= 50
    'reached_competent',       -- Corrix score >= 70
    'reached_proficient',      -- Corrix score >= 85
    'reached_expert',          -- Corrix score >= 95
    'skill_milestone',         -- Specific skill reached threshold
    'streak_milestone',        -- Consistent performance streak
    'improvement_milestone'    -- Significant improvement
  )),

  -- Event details
  milestone_name VARCHAR(100),
  milestone_value DECIMAL(8,4),
  previous_value DECIMAL(8,4),

  -- Context
  days_since_first_use INTEGER,
  total_sessions INTEGER,
  total_interactions INTEGER,

  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning velocity tracking (rolling calculations)
CREATE TABLE IF NOT EXISTS learning_velocity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Velocity metrics (points per week)
  velocity_7d DECIMAL(8,4),      -- Last 7 days
  velocity_14d DECIMAL(8,4),     -- Last 14 days
  velocity_30d DECIMAL(8,4),     -- Last 30 days
  velocity_90d DECIMAL(8,4),     -- Last 90 days

  -- Acceleration (change in velocity)
  acceleration DECIMAL(8,4),

  -- Ranking
  rank_in_org INTEGER,
  rank_in_team INTEGER,
  rank_in_role INTEGER,

  -- Percentiles
  percentile_in_org DECIMAL(5,2),
  percentile_in_team DECIMAL(5,2)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_snapshots_user_date ON skill_snapshots(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_skill_snapshots_trajectory ON skill_snapshots(trajectory_direction);
CREATE INDEX IF NOT EXISTS idx_competency_events_user ON competency_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_competency_events_type ON competency_events(event_type);
CREATE INDEX IF NOT EXISTS idx_learning_velocity_user ON learning_velocity(user_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_velocity_rank ON learning_velocity(rank_in_org);
