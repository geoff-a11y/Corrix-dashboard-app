import { api } from './client';
import type { ScoreDistribution, BehaviorMetrics } from '@corrix/shared';

interface BehaviorParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CollaborationModeData {
  mode: string;
  displayName: string;
  percentage: number;
  avgScore: number;
  count: number;
}

export interface CollaborationModeAnalytics {
  modes: CollaborationModeData[];
  totalInteractions: number;
}

export interface ModeScores {
  modes: Array<{
    mode: string;
    displayName: string;
    avgCorrixScore: number;
    avgResults: number;
    avgRelationship: number;
    avgResilience: number;
    sessionCount: number;
    percentage: number;
  }>;
  totalSessions: number;
  insights: string[];
}

export interface UsagePatterns {
  byHour: Array<{
    hour: number;
    sessionCount: number;
    avgCorrixScore: number;
    avgResults: number;
    avgRelationship: number;
    avgResilience: number;
  }>;
  byDayPart: {
    morning: { hours: string; sessionCount: number; avgCorrixScore: number; avgResults: number; avgRelationship: number; avgResilience: number };
    afternoon: { hours: string; sessionCount: number; avgCorrixScore: number; avgResults: number; avgRelationship: number; avgResilience: number };
    evening: { hours: string; sessionCount: number; avgCorrixScore: number; avgResults: number; avgRelationship: number; avgResilience: number };
    night: { hours: string; sessionCount: number; avgCorrixScore: number; avgResults: number; avgRelationship: number; avgResilience: number };
  };
  peakProductivity: {
    bestHour: number;
    bestDayPart: string;
    bestDay: string;
    scoreVariation: number;
    recommendation: string;
  };
  criticalEngagement: {
    lowEngagementUsers: Array<{
      userId: string;
      displayId: string;
      engagementRate: number;
      sessionCount: number;
      riskLevel: 'high' | 'medium' | 'low';
    }>;
    averageEngagementRate: number;
    healthyThreshold: number;
    insight: string;
  };
}

export const behaviorsApi = {
  getPromptQuality(params: BehaviorParams): Promise<ScoreDistribution> {
    return api.get('/behaviors/prompt-quality', params);
  },

  getActions(params: BehaviorParams): Promise<BehaviorMetrics['actions']> {
    return api.get('/behaviors/actions', params);
  },

  getSessions(params: BehaviorParams): Promise<BehaviorMetrics['sessions']> {
    return api.get('/behaviors/sessions', params);
  },

  getPlatforms(params: BehaviorParams): Promise<BehaviorMetrics['platforms']> {
    return api.get('/behaviors/platforms', params);
  },

  getCollaborationModes(params: BehaviorParams): Promise<CollaborationModeAnalytics> {
    return api.get('/behaviors/collaboration-modes', params);
  },

  getModeScores(params: BehaviorParams): Promise<ModeScores> {
    return api.get('/behaviors/mode-scores', params);
  },

  getUsagePatterns(params: BehaviorParams): Promise<UsagePatterns> {
    return api.get('/behaviors/usage-patterns', params);
  },
};
