import { api } from './client';

export interface UserListItem {
  id: string;
  displayId: string;  // Anonymized ID like "User #A1B2"
}

export interface UserSummary {
  userId: string;
  displayId: string;
  hasData: boolean;
  latestScore?: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    date: string;
  };
}

export const usersApi = {
  listUsers(params: {
    organizationId?: string;
    teamId?: string;
  }): Promise<UserListItem[]> {
    return api.get('/users/list', params);
  },

  getUserSummary(userId: string): Promise<UserSummary> {
    return api.get(`/users/${userId}/summary`);
  },
};
