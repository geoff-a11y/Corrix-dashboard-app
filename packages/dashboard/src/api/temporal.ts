import { api } from './client';
import type {
  TemporalIndicatorDashboard,
  IndicatorTrend,
  LeadingIndicatorAlert,
} from '@corrix/shared';

interface TemporalParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  date?: string;
}

interface TrendParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  days?: number;
}

export const temporalApi = {
  getDashboard(params: TemporalParams): Promise<TemporalIndicatorDashboard> {
    return api.get('/temporal/dashboard', params);
  },

  getIndicatorTrend(
    indicatorName: string,
    params: TrendParams
  ): Promise<IndicatorTrend> {
    return api.get(`/temporal/indicators/${indicatorName}/trend`, params);
  },

  getLeadingAlerts(params: {
    organizationId?: string;
    teamId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    severity?: 'warning' | 'critical';
  }): Promise<LeadingIndicatorAlert[]> {
    return api.get('/temporal/leading/alerts', params);
  },

  getCorrelations(organizationId: string): Promise<{
    correlations: Array<{
      leadingIndicator: string;
      laggingIndicator: string;
      correlation: number;
      lag: number;
    }>;
  }> {
    return api.get('/temporal/correlations', { organizationId });
  },
};
