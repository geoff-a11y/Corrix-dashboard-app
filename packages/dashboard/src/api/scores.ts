import { api } from './client';
import type { ScoreDistribution, ScoreTrend, ThreeRsScores, ThreeRsTimePatterns, DomainScoresResponse } from '@corrix/shared';

interface ScoreParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

interface TrendParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  metric: string;
  period: 'day' | 'week' | 'month';
  duration: number;
}

export interface DomainBreakdown {
  domains: Array<{
    domainId: string;
    domainName: string;
    results: number;
    relationship: number;
    resilience: number;
    overall: number;
    sessionCount: number;
    trend: 'improving' | 'stable' | 'declining';
    trendPercentage: number;
  }>;
  summary: {
    totalDomains: number;
    totalSessions: number;
    averageOverall: number;
    topPerformingDomain: string;
    needsAttentionDomain: string;
    insights: string[];
  };
}

export const scoresApi = {
  getDistribution(params: ScoreParams): Promise<ScoreDistribution> {
    return api.get('/scores/distribution', params);
  },

  getDimensionalBalance(params: ScoreParams): Promise<ThreeRsScores> {
    return api.get('/scores/dimensional-balance', params);
  },

  getDimensionBreakdown(params: ScoreParams & { dimension: string }): Promise<Record<string, number>> {
    return api.get('/scores/dimension-breakdown', params);
  },

  getTrends(params: TrendParams): Promise<ScoreTrend> {
    return api.get('/scores/trends', params);
  },

  getTimePatterns(params: ScoreParams): Promise<ThreeRsTimePatterns> {
    return api.get('/scores/time-patterns', params);
  },

  getDomainScores(params: ScoreParams): Promise<DomainScoresResponse> {
    return api.get('/scores/domains', params);
  },

  getDomainBreakdown(params: ScoreParams): Promise<DomainBreakdown> {
    return api.get('/scores/domain-breakdown', params);
  },
};
