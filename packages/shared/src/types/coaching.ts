/**
 * Coaching Analytics Types
 *
 * Types for the admin coaching insights dashboard that shows
 * effectiveness of coaching tips across users, teams, and orgs.
 */

import type { TrendDirection } from './temporal';

// ============================================================================
// Core Enums
// ============================================================================

export type AdvancedCoachingType =
  | 'hallucination_risk'
  | 'refusal_recovery'
  | 'stop_ramble'
  | 'math_date_check'
  | 'contradictory_instructions'
  | 'action_extraction'
  | 'red_team_check'
  | 'fact_check_mode'
  | 'anti_generic'
  | 'stepwise_mode'
  | 'off_piste_drift'
  | 'off_piste_constraint'
  | 'off_piste_invented'
  | 'off_piste_looping'
  | 'sycophancy_detection'
  | 'hollow_feedback_alert'
  | 'critical_engagement'
  | 'session_summary_offer'
  | 'validation_reframe'
  | 'micro_action';

export type DreyfusStage =
  | 'novice'
  | 'advanced_beginner'
  | 'competent'
  | 'proficient'
  | 'expert';

export type BehaviorProfile =
  | 'quick_accepter'
  | 'careful_reader'
  | 'heavy_editor'
  | 'iterative_refiner'
  | 'mixed';

export type CoachingAction =
  | 'injected_prompt'
  | 'dismissed'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'clicked_away';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
// Note: TrendDirection is defined in temporal.ts and exported from there

// ============================================================================
// Effectiveness Stats
// ============================================================================

export interface CoachingEffectivenessStats {
  coachingType: AdvancedCoachingType;
  totalShown: number;
  actedUpon: number;
  thumbsUp: number;
  dismissed: number;
  thumbsDown: number;
  improved: number;
  notImproved: number;
  effectivenessRate: number;  // (actedUpon + thumbsUp) / totalShown
  dismissalRate: number;      // dismissed / totalShown
  improvementRate: number;    // improved / (improved + notImproved)
  confidenceLevel: ConfidenceLevel;
}

export interface SegmentedEffectivenessStats extends CoachingEffectivenessStats {
  segment: string;  // e.g., 'novice', 'technology', 'quick_accepter'
  segmentType: 'expertise' | 'domain' | 'behavior';
}

// ============================================================================
// Aggregate Analytics
// ============================================================================

export interface CoachingTypeAnalytics {
  coachingType: AdvancedCoachingType;
  displayName: string;
  description: string;
  category: 'safety' | 'quality' | 'efficiency' | 'behavior';

  overall: CoachingEffectivenessStats;

  byExpertise: Record<DreyfusStage, CoachingEffectivenessStats>;
  byDomain: Record<string, CoachingEffectivenessStats>;
  byBehavior: Record<BehaviorProfile, CoachingEffectivenessStats>;

  trend: TrendDirection;
  trendData: Array<{
    date: string;
    effectivenessRate: number;
    dismissalRate: number;
    totalShown: number;
  }>;

  enabled: boolean;
  lastUpdated: string;
}

export interface CoachingAnalyticsSummary {
  // Overall metrics
  totalTipsShown: number;
  totalActedUpon: number;
  totalDismissed: number;
  totalImproved: number;
  overallEffectivenessRate: number;
  overallDismissalRate: number;
  overallImprovementRate: number;

  // Top performers
  topEffective: Array<{
    coachingType: AdvancedCoachingType;
    effectivenessRate: number;
    sampleSize: number;
  }>;

  // Needs attention
  lowPerformers: Array<{
    coachingType: AdvancedCoachingType;
    effectivenessRate: number;
    dismissalRate: number;
    sampleSize: number;
    recommendation: string;
  }>;

  // Distribution
  byCategory: Record<string, {
    totalShown: number;
    effectivenessRate: number;
  }>;

  // Time range
  dateRange: {
    start: string;
    end: string;
  };
}

// ============================================================================
// Heatmap Data
// ============================================================================

export interface EffectivenessMatrixCell {
  coachingType: AdvancedCoachingType;
  segment: string;
  segmentType: 'expertise' | 'domain';
  effectivenessRate: number;
  sampleSize: number;
  confidenceLevel: ConfidenceLevel;
}

export interface EffectivenessMatrix {
  rows: AdvancedCoachingType[];
  columns: string[];  // expertise stages or domains
  columnType: 'expertise' | 'domain';
  cells: EffectivenessMatrixCell[];
}

// ============================================================================
// Recommendations
// ============================================================================

export type RecommendationAction =
  | 'increase_frequency'
  | 'decrease_frequency'
  | 'restrict_to_expertise'
  | 'restrict_to_domain'
  | 'disable'
  | 'monitor'
  | 'expand_audience';

export interface CoachingRecommendation {
  coachingType: AdvancedCoachingType;
  action: RecommendationAction;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  supportingData: {
    currentEffectiveness: number;
    currentDismissal: number;
    sampleSize: number;
    trend: TrendDirection;
    bestSegment?: string;
    worstSegment?: string;
  };
  suggestedFilters?: {
    expertiseFilter?: DreyfusStage[];
    domainFilter?: string[];
    behaviorFilter?: BehaviorProfile[];
  };
}

// ============================================================================
// Targeting Configuration
// ============================================================================

export interface TargetingRuleConfig {
  coachingType: AdvancedCoachingType;
  enabled: boolean;
  expertiseFilter: DreyfusStage[] | 'all';
  domainFilter: string[] | 'all';
  behaviorFilter: BehaviorProfile[] | 'all';
  minEffectivenessRate: number;
  maxDismissalRate: number;
  cooldownMultiplier: number;
  priority: number;
}

export interface TargetingConfigUpdate {
  rules: TargetingRuleConfig[];
  globalDisabled: AdvancedCoachingType[];
  updatedBy: string;
  notes?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CoachingAnalyticsRequest {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  coachingTypes?: AdvancedCoachingType[];
}

export interface CoachingAnalyticsResponse {
  summary: CoachingAnalyticsSummary;
  byType: CoachingTypeAnalytics[];
  matrix: EffectivenessMatrix;
  recommendations: CoachingRecommendation[];
  scope: {
    level: 'global' | 'organization' | 'team' | 'user';
    id?: string;
    name?: string;
  };
}

// ============================================================================
// Display Helpers
// ============================================================================

export const COACHING_TYPE_DISPLAY: Record<AdvancedCoachingType, {
  name: string;
  description: string;
  category: 'safety' | 'quality' | 'efficiency' | 'behavior';
}> = {
  hallucination_risk: {
    name: 'Hallucination Risk',
    description: 'Warns about unsourced factual claims',
    category: 'safety',
  },
  refusal_recovery: {
    name: 'Refusal Recovery',
    description: 'Helps recover from AI refusals',
    category: 'efficiency',
  },
  stop_ramble: {
    name: 'Stop Ramble',
    description: 'Suggests summarizing long responses',
    category: 'efficiency',
  },
  math_date_check: {
    name: 'Math/Date Check',
    description: 'Prompts verification of calculations',
    category: 'safety',
  },
  contradictory_instructions: {
    name: 'Contradictory Instructions',
    description: 'Detects conflicting requirements',
    category: 'quality',
  },
  action_extraction: {
    name: 'Action Extraction',
    description: 'Converts advice to actionable steps',
    category: 'efficiency',
  },
  red_team_check: {
    name: 'Red Team Check',
    description: 'Suggests considering failure modes',
    category: 'quality',
  },
  fact_check_mode: {
    name: 'Fact Check Mode',
    description: 'Prompts verification before sharing',
    category: 'safety',
  },
  anti_generic: {
    name: 'Anti-Generic',
    description: 'Pushes for specific answers',
    category: 'quality',
  },
  stepwise_mode: {
    name: 'Stepwise Mode',
    description: 'Suggests breaking into steps',
    category: 'efficiency',
  },
  off_piste_drift: {
    name: 'Topic Drift',
    description: 'Detects response wandering',
    category: 'behavior',
  },
  off_piste_constraint: {
    name: 'Constraint Violation',
    description: 'Catches ignored constraints',
    category: 'behavior',
  },
  off_piste_invented: {
    name: 'Invented Context',
    description: 'Flags assumed information',
    category: 'behavior',
  },
  off_piste_looping: {
    name: 'Looping Detection',
    description: 'Detects repetitive responses',
    category: 'behavior',
  },
  sycophancy_detection: {
    name: 'Sycophancy Detection',
    description: 'Warns about excessive agreement',
    category: 'quality',
  },
  hollow_feedback_alert: {
    name: 'Hollow Feedback Alert',
    description: 'Flags generic praise without actionable suggestions',
    category: 'quality',
  },
  critical_engagement: {
    name: 'Critical Engagement',
    description: 'Prompts verification of AI outputs',
    category: 'behavior',
  },
  session_summary_offer: {
    name: 'Session Summary Offer',
    description: 'Offers end-of-session insights instead of interruptions',
    category: 'efficiency',
  },
  validation_reframe: {
    name: 'Validation Reframe',
    description: 'Suggests reframing validation-seeking prompts',
    category: 'behavior',
  },
  micro_action: {
    name: 'Micro Action',
    description: 'Suggests specific small actions instead of generic reminders',
    category: 'behavior',
  },
};

export const DREYFUS_STAGE_DISPLAY: Record<DreyfusStage, string> = {
  novice: 'Novice',
  advanced_beginner: 'Advanced Beginner',
  competent: 'Competent',
  proficient: 'Proficient',
  expert: 'Expert',
};

export const BEHAVIOR_PROFILE_DISPLAY: Record<BehaviorProfile, string> = {
  quick_accepter: 'Quick Accepter',
  careful_reader: 'Careful Reader',
  heavy_editor: 'Heavy Editor',
  iterative_refiner: 'Iterative Refiner',
  mixed: 'Mixed',
};
