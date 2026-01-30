-- Add metadata columns to credentials table for public/shareable context
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS role_level VARCHAR(50);
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS scenario_category VARCHAR(100);
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS company_size VARCHAR(20);

-- Add metadata columns to live_sessions for live chat assessments
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS role_level VARCHAR(50);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS company_size VARCHAR(20);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS years_experience VARCHAR(20);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS primary_function VARCHAR(50);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS browser_family VARCHAR(50);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS os_family VARCHAR(50);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS screen_category VARCHAR(20);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS avg_response_time_seconds FLOAT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS avg_message_length FLOAT;

-- Create assessment_metadata table for comprehensive analytics
CREATE TABLE IF NOT EXISTS assessment_metadata (
  id SERIAL PRIMARY KEY,
  credential_id UUID REFERENCES credentials(id),
  baseline_assessment_id UUID REFERENCES baseline_assessments(id),
  live_session_id UUID REFERENCES live_sessions(id),

  -- Professional context
  industry VARCHAR(50),
  role_level VARCHAR(50),
  company_size VARCHAR(20),
  years_experience VARCHAR(20),
  primary_function VARCHAR(50),

  -- Geographic
  country_code VARCHAR(2),
  region VARCHAR(50),
  timezone VARCHAR(100),

  -- Device
  device_type VARCHAR(20),
  browser_family VARCHAR(50),
  os_family VARCHAR(50),
  screen_category VARCHAR(20),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  time_of_day_bucket VARCHAR(20),
  day_of_week INTEGER,

  -- Assessment specific
  assessment_type VARCHAR(20) NOT NULL, -- 'quick' or 'live_chat'
  scenario_category VARCHAR(100),
  scenario_id VARCHAR(100),
  platform_detected VARCHAR(50),
  exchange_count INTEGER,
  total_user_chars INTEGER,
  total_ai_chars INTEGER,
  conversation_count INTEGER,
  total_messages_analyzed INTEGER,

  -- Behavioral (live chat)
  avg_response_time_seconds FLOAT,
  avg_message_length FLOAT,
  question_ratio FLOAT,
  revision_count INTEGER,

  -- Attribution
  referral_source VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_metadata_credential ON assessment_metadata(credential_id);
CREATE INDEX IF NOT EXISTS idx_metadata_industry ON assessment_metadata(industry);
CREATE INDEX IF NOT EXISTS idx_metadata_role ON assessment_metadata(role_level);
CREATE INDEX IF NOT EXISTS idx_metadata_country ON assessment_metadata(country_code);
CREATE INDEX IF NOT EXISTS idx_metadata_type ON assessment_metadata(assessment_type);
CREATE INDEX IF NOT EXISTS idx_metadata_created ON assessment_metadata(created_at);

-- Add indexes to credentials for benchmarking queries
CREATE INDEX IF NOT EXISTS idx_credentials_industry ON credentials(industry);
CREATE INDEX IF NOT EXISTS idx_credentials_role ON credentials(role_level);
CREATE INDEX IF NOT EXISTS idx_credentials_country ON credentials(country_code);
