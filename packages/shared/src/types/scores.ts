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
