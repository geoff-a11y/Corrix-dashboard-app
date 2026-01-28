-- Baseline Assessments for public lead-generation tool
-- Users can run assessment prompt in any AI tool and paste results

-- Create "Open Baseline" team for storing public assessments
INSERT INTO teams (id, name, organization_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Open Baseline',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Main assessments table
CREATE TABLE baseline_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User identification
  email TEXT NOT NULL,

  -- Assessment metadata
  platform_detected TEXT CHECK (platform_detected IN ('chatgpt', 'claude', 'gemini', 'unknown')),
  conversation_count_analyzed INTEGER,
  assessment_version TEXT DEFAULT '1.0',

  -- Overall scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

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
  obs_recommendation_1 TEXT,
  obs_recommendation_2 TEXT,
  obs_recommendation_3 TEXT,

  -- Full JSON for reference
  raw_assessment_json JSONB NOT NULL,

  -- Team association (for admin access)
  team_id UUID REFERENCES teams(id) DEFAULT 'a0000000-0000-0000-0000-000000000001',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domains table (1-3 per assessment)
CREATE TABLE baseline_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES baseline_assessments(id) ON DELETE CASCADE,

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

-- Indexes
CREATE INDEX idx_baseline_email ON baseline_assessments(email);
CREATE INDEX idx_baseline_created ON baseline_assessments(created_at DESC);
CREATE INDEX idx_baseline_team ON baseline_assessments(team_id);
CREATE INDEX idx_baseline_overall_score ON baseline_assessments(overall_score);
CREATE INDEX idx_baseline_platform ON baseline_assessments(platform_detected);
CREATE INDEX idx_baseline_domains_assessment ON baseline_domains(assessment_id);

-- Updated at trigger
CREATE TRIGGER update_baseline_assessments_updated_at
  BEFORE UPDATE ON baseline_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
