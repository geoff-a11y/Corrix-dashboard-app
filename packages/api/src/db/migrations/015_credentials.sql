-- Credentials table for professional AI collaboration credentials
-- Separate from baseline assessments - full credentialing system with calibration

-- Create "Credential System" team for storing public credentials
INSERT INTO teams (id, name, organization_id)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Credential System',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Platform calibration factors (for cross-platform score normalization)
CREATE TABLE platform_calibration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('chatgpt', 'claude', 'gemini')),
  sample_size INTEGER NOT NULL DEFAULT 0,
  mean_score NUMERIC(5,2),
  std_dev NUMERIC(5,2),
  calibration_offset NUMERIC(4,2) NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, effective_date)
);

-- Insert initial calibration baselines (to be updated with real data)
INSERT INTO platform_calibration (platform, calibration_offset, sample_size, mean_score, std_dev)
VALUES
  ('claude', 0, 0, NULL, NULL),
  ('chatgpt', -2.5, 0, NULL, NULL),
  ('gemini', -1.2, 0, NULL, NULL);

-- Main credentials table
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Unique credential ID (CRX-YYYY-MM-DD-XXXX format)
  credential_id TEXT NOT NULL UNIQUE,

  -- User identification
  email TEXT NOT NULL,
  holder_name TEXT,  -- Optional display name

  -- Platform and calibration
  platform_detected TEXT CHECK (platform_detected IN ('chatgpt', 'claude', 'gemini', 'unknown')),
  raw_overall_score INTEGER CHECK (raw_overall_score >= 0 AND raw_overall_score <= 100),
  calibrated_overall_score INTEGER CHECK (calibrated_overall_score >= 0 AND calibrated_overall_score <= 100),
  calibration_version TEXT DEFAULT '1.0',
  percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),

  -- Assessment metadata
  conversation_count_analyzed INTEGER,
  assessment_version TEXT DEFAULT '1.0',

  -- Qualification rating
  qualification_rating TEXT NOT NULL CHECK (qualification_rating IN ('exceptional', 'strong', 'qualified', 'developing', 'concern')),

  -- Profile information (AI-generated)
  profile_type TEXT NOT NULL,  -- e.g. "Strategic Consultant", "Technical Collaborator"
  profile_description TEXT,

  -- Results dimension
  results_overall INTEGER CHECK (results_overall >= 0 AND results_overall <= 100),
  results_decision_quality INTEGER CHECK (results_decision_quality >= 0 AND results_decision_quality <= 100),
  results_output_accuracy INTEGER CHECK (results_output_accuracy >= 0 AND results_output_accuracy <= 100),
  results_efficiency INTEGER CHECK (results_efficiency >= 0 AND results_efficiency <= 100),

  -- Relationship dimension
  relationship_overall INTEGER CHECK (relationship_overall >= 0 AND relationship_overall <= 100),
  relationship_appropriateness_of_reliance INTEGER CHECK (relationship_appropriateness_of_reliance >= 0 AND relationship_appropriateness_of_reliance <= 100),
  relationship_trust_calibration INTEGER CHECK (relationship_trust_calibration >= 0 AND relationship_trust_calibration <= 100),
  relationship_dialogue_quality INTEGER CHECK (relationship_dialogue_quality >= 0 AND relationship_dialogue_quality <= 100),

  -- Resilience dimension
  resilience_overall INTEGER CHECK (resilience_overall >= 0 AND resilience_overall <= 100),
  resilience_cognitive_sustainability INTEGER CHECK (resilience_cognitive_sustainability >= 0 AND resilience_cognitive_sustainability <= 100),
  resilience_skill_trajectory INTEGER CHECK (resilience_skill_trajectory >= 0 AND resilience_skill_trajectory <= 100),
  resilience_expertise_preservation INTEGER CHECK (resilience_expertise_preservation >= 0 AND resilience_expertise_preservation <= 100),

  -- Collaboration modes
  mode_primary TEXT CHECK (mode_primary IN ('approving', 'consulting', 'supervising', 'delegating')),
  mode_approving_pct INTEGER CHECK (mode_approving_pct >= 0 AND mode_approving_pct <= 100),
  mode_consulting_pct INTEGER CHECK (mode_consulting_pct >= 0 AND mode_consulting_pct <= 100),
  mode_supervising_pct INTEGER CHECK (mode_supervising_pct >= 0 AND mode_supervising_pct <= 100),
  mode_delegating_pct INTEGER CHECK (mode_delegating_pct >= 0 AND mode_delegating_pct <= 100),
  mode_switching_awareness TEXT CHECK (mode_switching_awareness IN ('high', 'some', 'low')),

  -- Usage patterns
  usage_peak_time TEXT CHECK (usage_peak_time IN ('morning', 'afternoon', 'evening')),
  usage_weekly_hours INTEGER,
  usage_weekly_interactions INTEGER,
  usage_critical_engagement_rate INTEGER CHECK (usage_critical_engagement_rate >= 0 AND usage_critical_engagement_rate <= 100),
  usage_learning_trajectory TEXT CHECK (usage_learning_trajectory IN ('accelerating', 'steady', 'declining')),
  usage_vocabulary_growth TEXT CHECK (usage_vocabulary_growth IN ('rapid', 'moderate', 'stable')),
  usage_topic_breadth TEXT CHECK (usage_topic_breadth IN ('focused', 'moderate', 'broad')),
  usage_knowledge_transfer INTEGER CHECK (usage_knowledge_transfer >= 0 AND usage_knowledge_transfer <= 100),

  -- Observations (text fields)
  obs_strengths TEXT,
  obs_growth_opportunities TEXT,
  obs_mode_insight TEXT,
  obs_domain_insight TEXT,
  obs_risk_flag TEXT,

  -- Arrays stored as TEXT[] (PostgreSQL native arrays)
  strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
  growth_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  red_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Interview probes (structured)
  interview_probes JSONB DEFAULT '[]'::JSONB,

  -- Full JSON for reference
  raw_assessment_json JSONB NOT NULL,

  -- Team association (for admin access)
  team_id UUID REFERENCES teams(id) DEFAULT 'a0000000-0000-0000-0000-000000000002',

  -- Verification
  is_verified BOOLEAN DEFAULT TRUE,
  verification_url TEXT,

  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 years'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credential domains table (1-3 per credential)
CREATE TABLE credential_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,

  -- Domain identification
  domain_name TEXT NOT NULL,
  domain_pct INTEGER CHECK (domain_pct >= 0 AND domain_pct <= 100),
  domain_expertise TEXT CHECK (domain_expertise IN ('novice', 'advanced_beginner', 'competent', 'proficient', 'expert')),

  -- Domain-specific Three Rs scores
  domain_results INTEGER CHECK (domain_results >= 0 AND domain_results <= 100),
  domain_relationship INTEGER CHECK (domain_relationship >= 0 AND domain_relationship <= 100),
  domain_resilience INTEGER CHECK (domain_resilience >= 0 AND domain_resilience <= 100),

  -- Order (1, 2, or 3)
  domain_order INTEGER CHECK (domain_order >= 1 AND domain_order <= 3),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for credentials
CREATE INDEX idx_credentials_credential_id ON credentials(credential_id);
CREATE INDEX idx_credentials_email ON credentials(email);
CREATE INDEX idx_credentials_created ON credentials(created_at DESC);
CREATE INDEX idx_credentials_issued ON credentials(issued_at DESC);
CREATE INDEX idx_credentials_team ON credentials(team_id);
CREATE INDEX idx_credentials_rating ON credentials(qualification_rating);
CREATE INDEX idx_credentials_platform ON credentials(platform_detected);
CREATE INDEX idx_credentials_calibrated_score ON credentials(calibrated_overall_score);
CREATE INDEX idx_credential_domains_credential ON credential_domains(credential_id);

-- Updated at triggers
CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_calibration_updated_at
  BEFORE UPDATE ON platform_calibration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
