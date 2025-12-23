import type { ThreeRsScores, ScoreDistribution, ScoreTrend } from './scores';
import type { TeamRankingEntry } from './teams';

// Organization-wide analytics
export interface OrganizationAnalytics {
  organizationId: string;
  organizationName: string;

  summary: {
    totalUsers: number;
    activeUsers: number;
    totalTeams: number;
    averageCorrixScore: number;
    scoreChange7d: number;
    scoreChange30d: number;
  };

  scoreDistribution: ScoreDistribution;
  dimensionalBalance: ThreeRsScores;  // Org-wide averages

  trends: {
    daily: ScoreTrend;
    weekly: ScoreTrend;
    monthly: ScoreTrend;
  };

  teamRanking: TeamRankingEntry[];
}

// Adoption tracking
export interface AdoptionMetrics {
  // Cumulative adoption
  cumulativeUsers: Array<{
    date: string;
    totalUsers: number;
    activeUsers: number;
  }>;

  // Adoption by team
  teamAdoption: Array<{
    teamId: string;
    teamName: string;
    totalMembers: number;
    adoptedMembers: number;
    adoptionRate: number;
    firstAdoptionDate: string;
    latestAdoptionDate: string;
  }>;

  // Adoption velocity
  velocity: {
    last7Days: number;   // New users
    last30Days: number;
    last90Days: number;
    averagePerWeek: number;
  };

  // Time to first interaction after adoption
  timeToFirstUse: {
    mean: number;    // hours
    median: number;
    p90: number;
  };
}
