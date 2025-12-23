import type { ScoreDistribution, ScoreTrend } from './scores';
import type { BehaviorMetrics } from './signals';

// Team comparison data
export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  userCount: number;
  activeUserCount: number;  // Active in last 7 days

  scores: {
    corrixScore: {
      mean: number;
      median: number;
      distribution: ScoreDistribution;
    };
    threeRs: {
      results: { mean: number; median: number };
      relationship: { mean: number; median: number };
      resilience: { mean: number; median: number };
    };
  };

  trends: {
    corrixScore: ScoreTrend;
    threeRs: {
      results: ScoreTrend;
      relationship: ScoreTrend;
      resilience: ScoreTrend;
    };
  };

  behaviors: BehaviorMetrics;
}

// Team ranking entry
export interface TeamRankingEntry {
  teamId: string;
  teamName: string;
  corrixScore: number;
  userCount: number;
  trend: 'up' | 'down' | 'stable';
}
