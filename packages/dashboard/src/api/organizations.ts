import { api } from './client';
import type { OrganizationAnalytics, AdoptionMetrics } from '@corrix/shared';

interface AdoptionParams {
  organizationId: string;
  granularity?: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  domain: string;
}

export const organizationsApi = {
  listOrganizations(): Promise<OrganizationListItem[]> {
    return api.get('/organizations/list');
  },

  getSummary(organizationId: string): Promise<OrganizationAnalytics['summary']> {
    return api.get(`/organizations/${organizationId}/summary`);
  },

  getAdoption(params: AdoptionParams): Promise<AdoptionMetrics> {
    return api.get(`/organizations/${params.organizationId}/adoption`, {
      granularity: params.granularity,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  },
};
