import { api } from './client';
import type {
  SkillTrajectory,
  LearningVelocity,
  SkillGapAnalysis,
  TimeToCompetencyMetrics,
  CompetencyEvent,
  VelocityPeriod,
  BenchmarkScope,
} from '@corrix/shared';

interface SkillsParams {
  organizationId?: string;
  teamId?: string;
  roleId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const skillsApi = {
  getTrajectory(userId: string, days?: number): Promise<SkillTrajectory> {
    return api.get(`/skills/trajectory/${userId}`, { days: days || 90 });
  },

  getVelocityLeaderboard(params: SkillsParams & {
    limit?: number;
    period?: VelocityPeriod;
  }): Promise<LearningVelocity[]> {
    return api.get('/skills/velocity/leaderboard', {
      ...params,
      limit: params.limit || 20,
      period: params.period || '30d',
    });
  },

  getSkillGaps(userId: string, params?: {
    benchmarkScope?: BenchmarkScope;
    benchmarkScopeId?: string;
  }): Promise<SkillGapAnalysis> {
    return api.get(`/skills/gaps/${userId}`, params);
  },

  getTimeToCompetency(params: SkillsParams & {
    cohortStart?: string;
    cohortEnd?: string;
  }): Promise<TimeToCompetencyMetrics> {
    return api.get('/skills/time-to-competency', params);
  },

  getUserMilestones(userId: string): Promise<CompetencyEvent[]> {
    return api.get(`/skills/milestones/${userId}`);
  },
};
