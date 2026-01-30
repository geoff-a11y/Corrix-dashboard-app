// Qualification rating tiers
export type QualificationRating = 'exceptional' | 'strong' | 'qualified' | 'developing' | 'concern';

// Platform types
export type Platform = 'chatgpt' | 'claude' | 'gemini' | 'unknown';

// Compact format from AI (abbreviated keys)
export interface CompactCredentialAssessment {
  v: string;
  ts: string;
  p: Platform;
  n: number;
  cs: string;
  s: {
    o: number;
    r: { o: number; d: number; a: number; e: number };
    l: { o: number; r: number; t: number; q: number };
    i: { o: number; c: number; s: number; x: number };
  };
  m: { p: string; a: number; c: number; s: number; d: number; w: string };
  do: Array<{ n: string; pct: number; x: string; r: number; l: number; i: number }>;
  u: {
    pt: string;
    wh: number;
    wi: number;
    ce: number;
    lt: string;
    vg: string;
    tb: string;
    kt: number;
  };
  ob: {
    st: string;
    go: string;
    mi: string;
    di: string;
    rf: string;
    rc: [string, string, string];
  };
  // Extended credential fields
  pr?: { t: string; d: string }; // profile: type, description
  rf?: string[]; // red_flags
  ip?: Array<{ a: string; p: string; r: string }>; // interview_probes
}

// Expanded format for display (full keys)
export interface DecodedCredentialAssessment {
  version: string;
  generated_at: string;
  platform_detected: Platform;
  conversation_count_analyzed: number;
  scores: {
    overall: number;
    results: {
      overall: number;
      decision_quality: number;
      output_accuracy: number;
      efficiency: number;
    };
    relationship: {
      overall: number;
      appropriateness_of_reliance: number;
      trust_calibration: number;
      dialogue_quality: number;
    };
    resilience: {
      overall: number;
      cognitive_sustainability: number;
      skill_trajectory: number;
      expertise_preservation: number;
    };
  };
  modes: {
    primary: 'approving' | 'consulting' | 'supervising' | 'delegating';
    approving_pct: number;
    consulting_pct: number;
    supervising_pct: number;
    delegating_pct: number;
    switching_awareness: 'high' | 'some' | 'low';
  };
  domains: Array<{
    name: string;
    pct: number;
    expertise: 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
    results: number;
    relationship: number;
    resilience: number;
  }>;
  usage: {
    peak_time: 'morning' | 'afternoon' | 'evening';
    weekly_hours_estimate: number;
    weekly_interactions_estimate: number;
    critical_engagement_rate: number;
    learning_trajectory: 'accelerating' | 'steady' | 'declining';
    vocabulary_growth: 'rapid' | 'moderate' | 'stable';
    topic_breadth: 'focused' | 'moderate' | 'broad';
    knowledge_transfer: number;
  };
  observations: {
    strengths: string;
    growth_opportunities: string;
    mode_insight: string;
    domain_insight: string;
    risk_flag: string;
    recommendations: [string, string, string];
  };
  // Extended credential fields
  profile?: {
    type: string;
    description: string;
  };
  red_flags?: string[];
  interview_probes?: Array<{
    area: string;
    probe: string;
    rationale: string;
  }>;
}

// Assessment types
export type AssessmentType = 'quick' | 'live_chat';

// Credential from API
export interface Credential {
  id: string;
  credential_id: string;
  email: string;
  holder_name: string | null;
  assessment_type: AssessmentType;
  platform_detected: Platform;
  raw_overall_score: number;
  calibrated_overall_score: number;
  calibration_version: string;
  percentile: number | null;
  conversation_count_analyzed: number;
  assessment_version: string;
  qualification_rating: QualificationRating;
  profile_type: string;
  profile_description: string | null;
  // Results
  results_overall: number;
  results_decision_quality: number;
  results_output_accuracy: number;
  results_efficiency: number;
  // Relationship
  relationship_overall: number;
  relationship_appropriateness_of_reliance: number;
  relationship_trust_calibration: number;
  relationship_dialogue_quality: number;
  // Resilience
  resilience_overall: number;
  resilience_cognitive_sustainability: number;
  resilience_skill_trajectory: number;
  resilience_expertise_preservation: number;
  // Modes
  mode_primary: string;
  mode_approving_pct: number;
  mode_consulting_pct: number;
  mode_supervising_pct: number;
  mode_delegating_pct: number;
  mode_switching_awareness: string;
  // Usage
  usage_peak_time: string;
  usage_weekly_hours: number;
  usage_weekly_interactions: number;
  usage_critical_engagement_rate: number;
  usage_learning_trajectory: string;
  usage_vocabulary_growth: string;
  usage_topic_breadth: string;
  usage_knowledge_transfer: number;
  // Observations
  obs_strengths: string;
  obs_growth_opportunities: string;
  obs_mode_insight: string;
  obs_domain_insight: string;
  obs_risk_flag: string;
  // Arrays
  strengths: string[];
  growth_areas: string[];
  red_flags: string[];
  recommendations: string[];
  interview_probes: Array<{ area: string; probe: string; rationale: string }>;
  // Domains
  domains: Array<{
    id: string;
    credential_id: string;
    domain_name: string;
    domain_pct: number;
    domain_expertise: string;
    domain_results: number;
    domain_relationship: number;
    domain_resilience: number;
    domain_order: number;
  }>;
  // Verification
  verification_url: string;
  is_verified: boolean;
  issued_at: string;
  expires_at: string;
  created_at: string;
}

// API Response types
export interface CredentialGenerateResponse {
  success: boolean;
  credential: {
    id: string;
    credential_id: string;
    verification_url: string;
    qualification_rating: QualificationRating;
    calibrated_score: number;
    raw_score: number;
    percentile: number | null;
    profile_type: string;
    holder_name: string | null;
  };
}

export interface CredentialVerifyResponse {
  valid: boolean;
  credential_id: string;
  holder_name: string | null;
  qualification_rating: QualificationRating;
  overall_score: number;
  scores: {
    results: number;
    relationship: number;
    resilience: number;
  };
  profile_type: string;
  issued_at: string;
  expires_at: string;
  is_expired: boolean;
}

// Helper functions
export function getRatingColor(rating: QualificationRating): string {
  switch (rating) {
    case 'exceptional': return '#22C55E'; // Green
    case 'strong': return '#3B82F6'; // Blue
    case 'qualified': return '#7877DF'; // Corrix Purple
    case 'developing': return '#F59E0B'; // Amber
    case 'concern': return '#EF4444'; // Red
  }
}

export function getRatingLabel(rating: QualificationRating): string {
  switch (rating) {
    case 'exceptional': return 'Exceptional';
    case 'strong': return 'Strong';
    case 'qualified': return 'Qualified';
    case 'developing': return 'Developing';
    case 'concern': return 'Needs Development';
  }
}

export function getRatingDescription(rating: QualificationRating): string {
  switch (rating) {
    case 'exceptional':
      return 'Ready for AI-leadership roles requiring sophisticated human-AI collaboration';
    case 'strong':
      return 'Ready for AI-intensive roles with minimal supervision';
    case 'qualified':
      return 'Meets baseline requirements for effective AI collaboration';
    case 'developing':
      return 'Shows potential with targeted development areas';
    case 'concern':
      return 'Significant development needed before AI-intensive work';
  }
}
