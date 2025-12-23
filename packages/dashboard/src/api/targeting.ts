import { api } from './client';

export interface TargetingRule {
  coachingType: string;
  enabled: boolean;
  expertiseFilter: string[] | 'all';
  domainFilter: string[] | 'all';
  minEffectivenessRate: number;
  maxDismissalRate: number;
}

export interface TargetingConfig {
  id?: string;
  version: number;
  rules: TargetingRule[];
  globalDisabled: string[];
  createdBy?: string;
  notes?: string;
  updatedAt: string | null;
  createdAt?: string;
}

export const targetingApi = {
  /**
   * Get current targeting configuration
   */
  getConfig(): Promise<TargetingConfig> {
    return api.get('/targeting/config');
  },

  /**
   * Update targeting configuration
   */
  updateConfig(params: {
    rules?: TargetingRule[];
    globalDisabled?: string[];
    notes?: string;
  }): Promise<TargetingConfig> {
    return api.post('/targeting/config', params);
  },

  /**
   * Toggle a coaching type's enabled/disabled status
   */
  toggleCoachingType(coachingType: string, enabled: boolean): Promise<TargetingConfig> {
    return api.post(`/targeting/toggle/${coachingType}`, { enabled });
  },

  /**
   * Update a specific coaching type's targeting rule
   */
  updateRule(coachingType: string, rule: Partial<TargetingRule>): Promise<TargetingConfig> {
    return api.post(`/targeting/rules/${coachingType}`, rule);
  },

  /**
   * Get config version history
   */
  getHistory(limit?: number): Promise<TargetingConfig[]> {
    return api.get('/targeting/history', { limit });
  },
};
