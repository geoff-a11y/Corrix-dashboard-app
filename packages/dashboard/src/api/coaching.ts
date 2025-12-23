import { api } from './client';
import type {
  CoachingAnalyticsResponse,
  CoachingAnalyticsSummary,
  CoachingTypeAnalytics,
  EffectivenessMatrix,
  CoachingRecommendation,
  AdvancedCoachingType,
} from '@corrix/shared';

interface CoachingParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  coachingTypes?: AdvancedCoachingType[];
}

export const coachingApi = {
  getAnalytics(params: CoachingParams): Promise<CoachingAnalyticsResponse> {
    const queryParams = {
      ...params,
      coachingTypes: params.coachingTypes?.join(','),
    };
    return api.get('/coaching/analytics', queryParams);
  },

  getSummary(params: Omit<CoachingParams, 'coachingTypes'>): Promise<CoachingAnalyticsSummary> {
    return api.get('/coaching/summary', params);
  },

  getByType(params: CoachingParams): Promise<CoachingTypeAnalytics[]> {
    const queryParams = {
      ...params,
      coachingTypes: params.coachingTypes?.join(','),
    };
    return api.get('/coaching/by-type', queryParams);
  },

  getMatrix(params: Omit<CoachingParams, 'coachingTypes'>): Promise<EffectivenessMatrix> {
    return api.get('/coaching/matrix', params);
  },

  getRecommendations(params: Omit<CoachingParams, 'coachingTypes'>): Promise<CoachingRecommendation[]> {
    return api.get('/coaching/recommendations', params);
  },

  getTypeDetail(type: AdvancedCoachingType, params: Omit<CoachingParams, 'coachingTypes'>): Promise<CoachingTypeAnalytics> {
    return api.get(`/coaching/type/${type}`, params);
  },
};
