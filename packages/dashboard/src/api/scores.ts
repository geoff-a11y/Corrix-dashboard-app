import { api } from './client';
import type { ScoreDistribution, ScoreTrend, ThreeRsScores } from '@corrix/shared';

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
};
