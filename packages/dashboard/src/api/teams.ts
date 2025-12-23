import { api } from './client';
import type { TeamAnalytics, TeamRankingEntry } from '@corrix/shared';

interface ComparisonParams {
  organizationId?: string;
  teamIds?: string[];
  startDate?: string;
  endDate?: string;
}

interface RankingParams {
  organizationId?: string;
  sortBy?: string;
  limit?: number;
}

export interface TeamListItem {
  id: string;
  name: string;
}

export const teamsApi = {
  listTeams(organizationId: string): Promise<TeamListItem[]> {
    return api.get('/teams/list', { organizationId });
  },

  getComparison(params: ComparisonParams): Promise<TeamAnalytics[]> {
    return api.get('/teams/comparison', {
      ...params,
      teamIds: params.teamIds?.join(','),
    });
  },

  getRanking(params: RankingParams): Promise<TeamRankingEntry[]> {
    return api.get('/teams/ranking', params);
  },

  getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    return api.get(`/teams/${teamId}`);
  },
};
