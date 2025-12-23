-- Migration 009: Pre-computed aggregation tables for caching expensive queries
-- These tables store pre-computed analytics to reduce database load

-- Score trend aggregations (pre-computed daily/weekly/monthly trends)
CREATE TABLE IF NOT EXISTS score_trend_aggregations (
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

-- Team ranking snapshots (daily snapshot of team rankings)
CREATE TABLE IF NOT EXISTS team_ranking_snapshots (
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

-- Score distribution snapshots (pre-computed distributions)
CREATE TABLE IF NOT EXISTS score_distribution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('organization', 'team')),
  scope_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  metric_name VARCHAR(50) NOT NULL,
  bucket_size INTEGER DEFAULT 10,
  buckets JSONB NOT NULL, -- Array of {min, max, count, percentage}
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

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_score_trend_agg_lookup
  ON score_trend_aggregations(scope_type, scope_id, metric_name, period_date DESC);

CREATE INDEX IF NOT EXISTS idx_team_ranking_lookup
  ON team_ranking_snapshots(organization_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_score_dist_lookup
  ON score_distribution_snapshots(scope_type, scope_id, snapshot_date DESC);

-- Job execution log (track when aggregation jobs run)
CREATE TABLE IF NOT EXISTS aggregation_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_job_logs_lookup
  ON aggregation_job_logs(job_name, started_at DESC);
