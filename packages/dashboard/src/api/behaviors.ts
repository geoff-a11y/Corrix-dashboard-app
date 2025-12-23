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
};
