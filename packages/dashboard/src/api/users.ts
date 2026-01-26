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

export interface UserSubMetrics {
  userId: string;
  displayId: string;
  results: {
    overall: number;
    subMetrics: {
      outcomeSatisfaction: number;
      editRatio: number;
      taskCompletion: number;
    };
    insights: string[];
  };
  relationship: {
    overall: number;
    subMetrics: {
      promptQuality: number;
      verificationRate: number;
      dialogueDepth: number;
      criticalEngagement: number;
    };
    insights: string[];
  };
  resilience: {
    overall: number;
    subMetrics: {
      skillTrajectory: number;
      errorRecovery: number;
      adaptation: number;
    };
    insights: string[];
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export interface UserExpertise {
  userId: string;
  displayId: string;
  overallLevel: string;
  overallScore: number;
  trajectory: string;
  trajectoryPercentage: number;
  byDomain: Array<{
    domainId: string;
    domainName: string;
    level: string;
    score: number;
    trajectory: string;
    trajectoryPercentage: number;
    sessionCount: number;
    strengths: string[];
    improvementAreas: string[];
  }>;
  recommendations: string[];
  milestones: Array<{
    date: string;
    achievement: string;
    scoreIncrease: number;
  }>;
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

  getUserSubMetrics(userId: string): Promise<UserSubMetrics> {
    return api.get(`/users/${userId}/sub-metrics`);
  },

  getUserExpertise(userId: string): Promise<UserExpertise> {
    return api.get(`/users/${userId}/expertise`);
  },
};
