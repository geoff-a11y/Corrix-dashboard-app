import { api } from './client';
import type { BaselineComparisonResponse, ScoreDriversResponse } from '@corrix/shared';

interface PerformanceParams {
  scope: 'organization' | 'team' | 'individual';
  entityId: string;
}

export interface BaselineData {
  scope: string;
  entityId: string;
  current: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    periodStart: string;
    periodEnd: string;
  };
  baseline: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    periodStart: string;
    periodEnd: string;
  };
  changes: {
    corrixScore: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    results: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    relationship: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    resilience: { absolute: number; percentage: number; trend: 'up' | 'down' | 'stable' };
  };
  historicalTrend: Array<{
    date: string;
    score: number;
  }>;
  insights: string[];
  milestones: Array<{
    date: string;
    achievement: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export const performanceApi = {
  getBaselineComparison(params: PerformanceParams): Promise<BaselineComparisonResponse> {
    return api.get('/performance/baseline-comparison', params);
  },

  getScoreDrivers(params: PerformanceParams): Promise<ScoreDriversResponse> {
    return api.get('/performance/score-drivers', params);
  },

  getBaseline(params: PerformanceParams): Promise<BaselineData> {
    return api.get('/performance/baseline', params);
  },
};
