// Deep behavior analytics types

// Verification behavior breakdown (Capability #12)
export interface VerificationBehaviorAnalysis {
  // Overall rate
  verificationRate: number;  // % of responses that trigger verification

  // Breakdown by type
  byType: {
    sourceRequests: number;      // "Can you cite that?"
    accuracyChecks: number;      // "Are you sure?"
    clarificationRequests: number; // "What do you mean?"
    crossReferencing: number;    // Checking against other sources
  };

  // Patterns
  verificationByComplexity: {
    simple: number;    // Verification rate for simple tasks
    moderate: number;
    complex: number;
  };

  verificationByPlatform: {
    claude: number;
    chatgpt: number;
    gemini: number;
  };

  // Trend
  trend: {
    current: number;
    previous: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
  };

  // Population comparison
  vsPopulation: {
    mean: number;
    percentile: number;
  };
}

// Edit ratio analysis (Capability #13)
export interface EditRatioAnalysis {
  // Overall
  overallEditRatio: number;  // % of AI content that's modified

  // Breakdown
  usedAsIs: number;          // % accepted without changes
  minorEdits: number;        // % with minor modifications
  majorEdits: number;        // % with significant changes
  discarded: number;         // % not used at all

  // By action type
  editPatterns: {
    copyAndEdit: number;     // Copied then edited externally
    inlineEdit: number;      // Edited within chat
    regenerated: number;     // Asked for new version
  };

  // Trend
  trend: Array<{
    date: string;
    editRatio: number;
  }>;

  // Insight
  insight: 'optimal' | 'over_accepting' | 'over_editing';
  insightExplanation: string;
}

// Dialogue depth analysis (Capability #14)
export interface DialogueDepthAnalysis {
  // Distribution
  distribution: {
    singleTurn: number;     // % of 1-turn conversations
    short: number;          // % of 2-3 turns
    medium: number;         // % of 4-7 turns
    deep: number;           // % of 8-15 turns
    veryDeep: number;       // % of 15+ turns
  };

  // Averages
  averageDepth: number;
  medianDepth: number;

  // By outcome
  depthByOutcome: {
    successful: number;     // Avg depth for successful outcomes
    unsuccessful: number;   // Avg depth for poor outcomes
  };

  // Optimal range
  optimalRange: { min: number; max: number };
  inOptimalRange: number;  // % of conversations in optimal range

  // Patterns
  patterns: {
    averageRefinementCycles: number;
    iterationVelocity: number;  // Turns per minute
  };
}

// Time-to-action analysis (Capability #15)
export interface TimeToActionAnalysis {
  // Overall
  averageTimeToAction: number;  // seconds
  medianTimeToAction: number;

  // Distribution
  distribution: {
    immediate: number;     // < 5 seconds (% of actions)
    quick: number;         // 5-15 seconds
    considered: number;    // 15-60 seconds
    deliberate: number;    // 1-5 minutes
    extended: number;      // > 5 minutes
  };

  // By action type
  byActionType: {
    accept: number;
    copy: number;
    edit: number;
    regenerate: number;
  };

  // Patterns
  patterns: {
    correlationWithQuality: number;  // Does more time = better outcomes?
    optimalRange: { min: number; max: number };
    inOptimalRange: number;
  };

  // Insights
  insight: 'impulsive' | 'optimal' | 'over_deliberating';
  recommendations: string[];
}

// Critical engagement analysis (Capability #17)
export interface CriticalEngagementAnalysis {
  // Overall rate
  criticalEngagementRate: number;  // % of conversations with critical engagement

  // By type
  byType: {
    pushback: number;           // "I don't think..."
    disagreement: number;       // "Actually..."
    alternativeRequest: number; // "What about..."
    limitationCheck: number;    // "Can you really..."
    reasoningRequest: number;   // "Why did you..."
  };

  // Trend
  trend: Array<{
    date: string;
    rate: number;
  }>;

  // Correlation with outcomes
  correlationWithOutcomes: number;

  // Distribution
  engagementDistribution: {
    none: number;      // % of users with no critical engagement
    low: number;       // Occasional
    moderate: number;  // Regular
    high: number;      // Frequent
  };
}

// Feedback quality analysis (Capability #20)
export interface FeedbackQualityAnalysis {
  // Overall score
  overallQuality: number;  // 0-100

  // Component scores
  components: {
    specificity: number;       // References specific parts
    explanation: number;       // Explains reasoning
    constructiveness: number;  // Offers alternatives
    actionability: number;     // AI can act on it
  };

  // Patterns
  patterns: {
    hasSpecificReference: number;  // % of feedback
    hasReasoning: number;
    hasAlternative: number;
    hasClearDirection: number;
  };

  // By conversation depth
  qualityByDepth: {
    early: number;     // First 3 turns
    mid: number;       // Turns 4-7
    late: number;      // After turn 7
  };

  // Trend
  trend: Array<{
    date: string;
    quality: number;
  }>;

  // Improvement areas
  improvementAreas: string[];
}

// Combined deep behavior summary
export interface DeepBehaviorSummary {
  userId?: string;
  teamId?: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;

  verification: VerificationBehaviorAnalysis;
  editRatio: EditRatioAnalysis;
  dialogueDepth: DialogueDepthAnalysis;
  timeToAction: TimeToActionAnalysis;
  criticalEngagement: CriticalEngagementAnalysis;
  feedbackQuality: FeedbackQualityAnalysis;
}
