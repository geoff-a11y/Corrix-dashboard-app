-- Migration 003: Temporal Indicators
-- Adds leading/concurrent/lagging indicator classification for metrics

-- Temporal indicator classification type
DO $$ BEGIN
  CREATE TYPE indicator_temporality AS ENUM ('leading', 'concurrent', 'lagging');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Store classified indicators with their current values
CREATE TABLE IF NOT EXISTS temporal_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Indicator identification
  indicator_name VARCHAR(100) NOT NULL,
  dimension VARCHAR(20) NOT NULL CHECK (dimension IN ('results', 'relationship', 'resilience')),
  temporality indicator_temporality NOT NULL,

  -- Values
  current_value DECIMAL(8,4),
  baseline_value DECIMAL(8,4),        -- User's historical baseline
  population_value DECIMAL(8,4),      -- Org/population average

  -- Derived metrics
  deviation_from_baseline DECIMAL(8,4),  -- Current vs personal baseline
  deviation_from_population DECIMAL(8,4), -- Current vs population
  percentile_rank DECIMAL(5,2),          -- Where user falls in population

  -- Trend
  trend_direction VARCHAR(10) CHECK (trend_direction IN ('improving', 'declining', 'stable')),
  trend_velocity DECIMAL(8,4),           -- Rate of change

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date, indicator_name)
);

-- Predefined indicator definitions
CREATE TABLE IF NOT EXISTS indicator_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  dimension VARCHAR(20) NOT NULL,
  temporality indicator_temporality NOT NULL,

  -- Calculation metadata
  source_table VARCHAR(100) NOT NULL,
  source_column VARCHAR(100) NOT NULL,
  aggregation_method VARCHAR(20) DEFAULT 'avg',  -- avg, sum, count, etc.

  -- Thresholds
  warning_threshold_low DECIMAL(8,4),
  warning_threshold_high DECIMAL(8,4),
  critical_threshold_low DECIMAL(8,4),
  critical_threshold_high DECIMAL(8,4),

  -- UI metadata
  display_order INTEGER DEFAULT 0,
  color_scheme VARCHAR(50) DEFAULT 'blue',
  icon VARCHAR(50),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed indicator definitions
INSERT INTO indicator_definitions (name, display_name, description, dimension, temporality, source_table, source_column, display_order) VALUES
-- Leading indicators (predict future)
('fatigue_level', 'Fatigue Level', 'Cognitive fatigue based on behavioral signals', 'resilience', 'leading', 'behavioral_signals', 'session_duration_seconds', 1),
('prompt_sophistication_trend', 'Prompt Sophistication Trend', 'Direction of prompt quality over recent sessions', 'relationship', 'leading', 'daily_scores', 'relationship_prompt_quality', 2),
('sustainable_pace', 'Sustainable Pace', 'Work intensity sustainability indicator', 'resilience', 'leading', 'behavioral_signals', 'session_duration_seconds', 3),

-- Concurrent indicators (current state)
('verification_depth', 'Verification Depth', 'How thoroughly outputs are being verified', 'relationship', 'concurrent', 'behavioral_signals', 'has_verification_request', 4),
('trust_calibration', 'Trust Calibration', 'Appropriateness of reliance on AI', 'relationship', 'concurrent', 'daily_scores', 'relationship_verification_rate', 5),
('error_recovery_speed', 'Error Recovery Speed', 'How quickly user recovers from AI errors', 'resilience', 'concurrent', 'behavioral_signals', 'time_to_action_seconds', 6),
('critical_engagement', 'Critical Engagement', 'Active questioning and pushback rate', 'relationship', 'concurrent', 'daily_scores', 'relationship_critical_engagement', 7),

-- Lagging indicators (confirmed outcomes)
('task_completion_rate', 'Task Completion Rate', 'Successfully completed interactions', 'results', 'lagging', 'daily_scores', 'results_task_completion', 8),
('output_accuracy', 'Output Accuracy', 'Quality of final outputs', 'results', 'lagging', 'daily_scores', 'results_outcome_satisfaction', 9),
('first_attempt_success', 'First Attempt Success', 'Success rate on first try', 'results', 'lagging', 'behavioral_signals', 'action_type', 10),
('learning_trajectory', 'Learning Trajectory', 'Skill improvement over time', 'resilience', 'lagging', 'daily_scores', 'resilience_skill_trajectory', 11)
ON CONFLICT (name) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_temporal_indicators_user_date ON temporal_indicators(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_temporal_indicators_temporality ON temporal_indicators(temporality);
CREATE INDEX IF NOT EXISTS idx_temporal_indicators_indicator ON temporal_indicators(indicator_name);
CREATE INDEX IF NOT EXISTS idx_indicator_definitions_active ON indicator_definitions(is_active) WHERE is_active = true;
