// Three Rs dimension scores
export interface ThreeRsScores {
  results: number;        // 0-100
  relationship: number;   // 0-100
  resilience: number;     // 0-100
}

// Results dimension breakdown
export interface ResultsBreakdown {
  outcomeSatisfaction: number;  // From user ratings
  editRatio: number;            // How much AI output is modified
  taskCompletion: number;       // Completion rate
}

// Relationship dimension breakdown
export interface RelationshipBreakdown {
  promptQuality: number;        // Context, constraints, examples, format
  verificationRate: number;     // How often outputs are verified
  dialogueDepth: number;        // Average turns per conversation
  criticalEngagement: number;   // Pushback, clarification, questioning
}

// Resilience dimension breakdown
export interface ResilienceBreakdown {
  skillTrajectory: number;      // Improvement over time
  errorRecovery: number;        // Recovery from AI mistakes
  adaptation: number;           // Strategy evolution
}

// Complete score record
export interface DailyScore {
  id: string;
  userId: string;
  date: string;  // ISO date
  corrixScore: number;
  threeRs: ThreeRsScores;
  resultsBreakdown: ResultsBreakdown;
  relationshipBreakdown: RelationshipBreakdown;
  resilienceBreakdown: ResilienceBreakdown;
  sessionCount: number;
  interactionCount: number;
}

// Score distribution for histograms
export interface ScoreDistribution {
  buckets: Array<{
    min: number;
    max: number;
    count: number;
    percentage: number;
  }>;
  mean: number;
  median: number;
  standardDeviation: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

// Trend data point
export interface TrendPoint {
  date: string;
  value: number;
  movingAverage?: number;
}

// Score trends over time
export interface ScoreTrend {
  metric: string;
  period: 'day' | 'week' | 'month';
  points: TrendPoint[];
  change: {
    absolute: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

// 3R scores by day part (morning/afternoon/evening)
export interface ThreeRsByDayPart {
  morning: ThreeRsWithSampleSize;
  afternoon: ThreeRsWithSampleSize;
  evening: ThreeRsWithSampleSize;
  insights: ThreeRsTimeInsight[];
}

// 3R scores by day of week
export interface ThreeRsByDayOfWeek {
  scores: Record<string, ThreeRsWithSampleSize>;  // 'Monday' -> scores
  insights: ThreeRsTimeInsight[];
}

// 3R scores with sample size for statistical validity
export interface ThreeRsWithSampleSize extends ThreeRsScores {
  sampleSize: number;  // Number of sessions this is based on
}

// Insight about 3R variation by time
export interface ThreeRsTimeInsight {
  metric: 'results' | 'relationship' | 'resilience';
  insight: string;           // "Results score is 18% higher in mornings"
  bestTime: string;          // "morning" or "Tuesday"
  worstTime: string;         // "evening" or "Friday"
  difference: number;        // Score difference between best and worst
  actionable: string;        // "Schedule verification-heavy tasks for mornings"
}

// Combined 3R time patterns response
export interface ThreeRsTimePatterns {
  byDayPart: ThreeRsByDayPart | null;
  byDayOfWeek: ThreeRsByDayOfWeek | null;
  summary: {
    hasEnoughData: boolean;
    totalSessions: number;
    dateRange: { start: string; end: string };
  };
}

// Per-domain 3R scores
export interface DomainScore {
  domainId: string;
  domainName: string;
  overall: number;
  results: number;
  relationship: number;
  resilience: number;
  interactionCount: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  calculatedAt: string;  // ISO timestamp
}

// Domain scores submission from extension
export interface DomainScoresSubmission {
  userId: string;
  organizationId?: string;
  teamId?: string;
  date: string;  // ISO date
  domains: DomainScore[];
}

// Domain scores response
export interface DomainScoresResponse {
  domains: DomainScore[];
  summary: {
    totalDomains: number;
    averageScore: number;
    topPerforming: string | null;  // Domain ID
    needsAttention: string | null;  // Domain ID with lowest score
  };
}
