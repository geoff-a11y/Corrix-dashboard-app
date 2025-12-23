-- Migration 006: Benchmarks
-- Adds population benchmarks and feedback quality analysis

-- Population benchmarks (updated daily)
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Scope
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN (
    'global',        -- All Corrix users (Tier 2/3 data only)
    'organization',  -- Single org
    'department',    -- Department within org
    'team',          -- Team within org
    'role',          -- Job role across org
    'role_category'  -- Role category across org
  )),
  scope_id UUID,       -- NULL for global, otherwise org/dept/team/role ID

  -- Metric being benchmarked
  metric_name VARCHAR(100) NOT NULL,
  metric_dimension VARCHAR(20),  -- results/relationship/resilience or NULL for composite

  -- Statistical measures
  mean DECIMAL(8,4) NOT NULL,
  median DECIMAL(8,4) NOT NULL,
  stddev DECIMAL(8,4),

  -- Percentiles
  p10 DECIMAL(8,4),
  p25 DECIMAL(8,4),
  p50 DECIMAL(8,4),
  p75 DECIMAL(8,4),
  p90 DECIMAL(8,4),
  p95 DECIMAL(8,4),

  -- Sample info
  sample_size INTEGER NOT NULL,
  active_users INTEGER,  -- Users with activity in period

  -- Time context
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(scope_type, scope_id, metric_name, period_start)
);

-- Feedback quality analysis (for Capability #20)
CREATE TABLE IF NOT EXISTS feedback_quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,

  -- The feedback message characteristics
  message_index INTEGER,  -- Position in conversation
  word_count INTEGER,

  -- Quality dimensions (0-100)
  specificity_score DECIMAL(5,2),       -- References specific parts
  explanation_score DECIMAL(5,2),       -- Explains why
  constructiveness_score DECIMAL(5,2),  -- Suggests alternatives
  actionability_score DECIMAL(5,2),     -- AI can act on it

  -- Composite
  overall_quality DECIMAL(5,2),

  -- Detected patterns
  has_specific_reference BOOLEAN,
  has_reasoning BOOLEAN,
  has_alternative_suggestion BOOLEAN,
  has_clear_direction BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to behavioral_signals for Phase 2 deep analytics
ALTER TABLE behavioral_signals
  ADD COLUMN IF NOT EXISTS first_attempt_success BOOLEAN,
  ADD COLUMN IF NOT EXISTS error_recovery_time INTEGER,
  ADD COLUMN IF NOT EXISTS edit_ratio DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS fatigue_score DECIMAL(5,2);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benchmarks_scope ON benchmarks(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_metric ON benchmarks(metric_name);
CREATE INDEX IF NOT EXISTS idx_benchmarks_period ON benchmarks(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_feedback_quality_user ON feedback_quality_scores(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_quality_session ON feedback_quality_scores(session_id);
