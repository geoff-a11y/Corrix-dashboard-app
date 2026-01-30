-- Live Chat Assessment tables
-- Supports 20-minute interactive scenario-based assessments

-- Add assessment_type to credentials table
ALTER TABLE credentials
ADD COLUMN IF NOT EXISTS assessment_type TEXT CHECK (assessment_type IN ('quick', 'live_chat')) DEFAULT 'quick';

-- Scenario variants table
CREATE TABLE scenario_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  scenario_id TEXT NOT NULL UNIQUE,  -- e.g. 'email-difficult-client'
  category TEXT NOT NULL,            -- e.g. 'professional-communication'

  -- Display
  name TEXT NOT NULL,                -- e.g. 'Email to a difficult client'
  context TEXT NOT NULL,             -- e.g. 'responding to a frustrated customer'
  description TEXT,                  -- Longer description for selection UI

  -- Assessment configuration
  system_prompt TEXT NOT NULL,       -- LLM system prompt for this scenario
  opening_message TEXT NOT NULL,     -- First message to user

  -- State machine moments
  -- JSON array of { state, trigger, injection_prompt }
  assessment_moments JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Configuration
  min_exchanges INTEGER DEFAULT 8,
  max_exchanges INTEGER DEFAULT 20,
  target_duration_minutes INTEGER DEFAULT 20,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live chat sessions
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session identification
  session_token TEXT NOT NULL UNIQUE,  -- For client-side reference

  -- User identification (optional email capture at end)
  email TEXT,

  -- Scenario
  scenario_variant_id UUID REFERENCES scenario_variants(id),
  scenario_id TEXT NOT NULL,

  -- State machine
  current_state TEXT NOT NULL DEFAULT 'opening',
  states_visited TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Signal tracking
  -- JSON object tracking detected signals
  signals_detected JSONB DEFAULT '{}'::JSONB,

  -- Statistics
  exchange_count INTEGER DEFAULT 0,
  total_user_chars INTEGER DEFAULT 0,
  total_ai_chars INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'error')),

  -- Link to credential (set on completion)
  credential_id UUID REFERENCES credentials(id),

  -- Assessment results (calculated on completion)
  results_score INTEGER CHECK (results_score >= 0 AND results_score <= 100),
  relationship_score INTEGER CHECK (relationship_score >= 0 AND relationship_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Assessment details
  assessment_json JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live chat messages
CREATE TABLE live_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Session reference
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Ordering
  sequence_number INTEGER NOT NULL,

  -- State at time of message
  session_state TEXT,

  -- Signals detected in this message (for user messages)
  signals JSONB DEFAULT '[]'::JSONB,

  -- Timing
  response_time_ms INTEGER,  -- Time user took to respond (for user messages)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_live_sessions_token ON live_sessions(session_token);
CREATE INDEX idx_live_sessions_email ON live_sessions(email);
CREATE INDEX idx_live_sessions_scenario ON live_sessions(scenario_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_created ON live_sessions(created_at DESC);
CREATE INDEX idx_live_sessions_credential ON live_sessions(credential_id);

CREATE INDEX idx_live_messages_session ON live_messages(session_id);
CREATE INDEX idx_live_messages_sequence ON live_messages(session_id, sequence_number);

CREATE INDEX idx_scenario_variants_category ON scenario_variants(category);
CREATE INDEX idx_scenario_variants_active ON scenario_variants(is_active);

-- Triggers
CREATE TRIGGER update_scenario_variants_updated_at
  BEFORE UPDATE ON scenario_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
