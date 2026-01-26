import { api } from './client';
import type { AlertsResponse, Recommendation } from '@corrix/shared';

interface AlertParams {
  organizationId?: string;
  teamId?: string;
  limit?: number;
}

export const alertsApi = {
  getAlerts(params: AlertParams): Promise<AlertsResponse> {
    return api.get('/alerts', params);
  },

  getRecommendations(params: AlertParams): Promise<Recommendation[]> {
    return api.get('/alerts/recommendations', params);
  },
};
