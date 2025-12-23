import db from '../db/connection.js';
import type { TeamAnalytics, TeamRankingEntry } from '@corrix/shared';

interface ComparisonParams {
  organizationId: string;
  teamIds?: string[];
  startDate?: string;
  endDate?: string;
}

interface RankingParams {
  organizationId: string;
  sortBy: string;
  limit: number;
}

interface TeamParams {
  teamId: string;
  startDate?: string;
  endDate?: string;
}

export class TeamAnalyticsService {

  async getTeamComparison(params: ComparisonParams): Promise<TeamAnalytics[]> {
    const { organizationId, teamIds, startDate, endDate } = params;

    const conditions: string[] = ['u.organization_id = $1'];
    const queryParams: (string | string[])[] = [organizationId];
    let paramIndex = 2;

    if (teamIds && teamIds.length > 0) {
      conditions.push(`t.id = ANY($${paramIndex++})`);
      queryParams.push(teamIds);
    }
    if (startDate) {
      conditions.push(`ds.date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      conditions.push(`ds.date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    const query = `
      SELECT
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN ds.date >= NOW() - INTERVAL '7 days' THEN u.id END) as active_user_count,
        COALESCE(AVG(ds.corrix_score), 0) as corrix_mean,
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.corrix_score), 0) as corrix_median,
        COALESCE(AVG(ds.results_score), 0) as results_mean,
        COALESCE(AVG(ds.relationship_score), 0) as relationship_mean,
        COALESCE(AVG(ds.resilience_score), 0) as resilience_mean
      FROM teams t
      JOIN users u ON u.team_id = t.id
      LEFT JOIN daily_scores ds ON ds.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY t.id, t.name
      ORDER BY corrix_mean DESC
    `;

    const result = await db.query(query, queryParams);

    return result.rows.map(row => ({
      teamId: row.team_id,
      teamName: row.team_name,
      userCount: parseInt(row.user_count),
      activeUserCount: parseInt(row.active_user_count),
      scores: {
        corrixScore: {
          mean: parseFloat(row.corrix_mean),
          median: parseFloat(row.corrix_median),
          distribution: { buckets: [], mean: 0, median: 0, standardDeviation: 0, percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 } },
        },
        threeRs: {
          results: { mean: parseFloat(row.results_mean), median: 0 },
          relationship: { mean: parseFloat(row.relationship_mean), median: 0 },
          resilience: { mean: parseFloat(row.resilience_mean), median: 0 },
        },
      },
      trends: {
        corrixScore: { metric: 'corrix', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
        threeRs: {
          results: { metric: 'results', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
          relationship: { metric: 'relationship', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
          resilience: { metric: 'resilience', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
        },
      },
      behaviors: {
        promptQuality: { mean: 0, distribution: { buckets: [], mean: 0, median: 0, standardDeviation: 0, percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 } }, componentRates: { hasContext: 0, hasConstraints: 0, hasExamples: 0, hasFormatSpec: 0 } },
        actions: { accept: 0, copy: 0, edit: 0, regenerate: 0, abandon: 0 },
        sessions: { averageDuration: 0, averageInteractions: 0, peakHours: [], averageDepth: 0 },
        platforms: { claude: 0, chatgpt: 0, gemini: 0 },
      },
    }));
  }

  async getTeamRanking(params: RankingParams): Promise<TeamRankingEntry[]> {
    const { organizationId, limit } = params;

    const query = `
      WITH team_scores AS (
        SELECT
          t.id as team_id,
          t.name as team_name,
          COUNT(DISTINCT u.id) as user_count,
          COALESCE(AVG(ds.corrix_score), 0) as corrix_score,
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '7 days'), 0) as recent_score,
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '14 days' AND ds.date < NOW() - INTERVAL '7 days'), 0) as prev_score
        FROM teams t
        JOIN users u ON u.team_id = t.id
        LEFT JOIN daily_scores ds ON ds.user_id = u.id
        WHERE u.organization_id = $1
        GROUP BY t.id, t.name
      )
      SELECT
        team_id,
        team_name,
        user_count,
        corrix_score,
        CASE
          WHEN recent_score > prev_score + 1 THEN 'up'
          WHEN recent_score < prev_score - 1 THEN 'down'
          ELSE 'stable'
        END as trend
      FROM team_scores
      ORDER BY corrix_score DESC
      LIMIT $2
    `;

    const result = await db.query(query, [organizationId, limit]);

    return result.rows.map(row => ({
      teamId: row.team_id,
      teamName: row.team_name,
      corrixScore: parseFloat(row.corrix_score),
      userCount: parseInt(row.user_count),
      trend: row.trend as 'up' | 'down' | 'stable',
    }));
  }

  async getTeamAnalytics(params: TeamParams): Promise<TeamAnalytics | null> {
    const { teamId } = params;

    const query = `
      SELECT
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN ds.date >= NOW() - INTERVAL '7 days' THEN u.id END) as active_user_count,
        COALESCE(AVG(ds.corrix_score), 0) as corrix_mean,
        COALESCE(AVG(ds.results_score), 0) as results_mean,
        COALESCE(AVG(ds.relationship_score), 0) as relationship_mean,
        COALESCE(AVG(ds.resilience_score), 0) as resilience_mean
      FROM teams t
      JOIN users u ON u.team_id = t.id
      LEFT JOIN daily_scores ds ON ds.user_id = u.id
      WHERE t.id = $1
      GROUP BY t.id, t.name
    `;

    const result = await db.query(query, [teamId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      teamId: row.team_id,
      teamName: row.team_name,
      userCount: parseInt(row.user_count),
      activeUserCount: parseInt(row.active_user_count),
      scores: {
        corrixScore: {
          mean: parseFloat(row.corrix_mean),
          median: 0,
          distribution: { buckets: [], mean: 0, median: 0, standardDeviation: 0, percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 } },
        },
        threeRs: {
          results: { mean: parseFloat(row.results_mean), median: 0 },
          relationship: { mean: parseFloat(row.relationship_mean), median: 0 },
          resilience: { mean: parseFloat(row.resilience_mean), median: 0 },
        },
      },
      trends: {
        corrixScore: { metric: 'corrix', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
        threeRs: {
          results: { metric: 'results', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
          relationship: { metric: 'relationship', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
          resilience: { metric: 'resilience', period: 'day', points: [], change: { absolute: 0, percentage: 0, direction: 'stable' } },
        },
      },
      behaviors: {
        promptQuality: { mean: 0, distribution: { buckets: [], mean: 0, median: 0, standardDeviation: 0, percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 } }, componentRates: { hasContext: 0, hasConstraints: 0, hasExamples: 0, hasFormatSpec: 0 } },
        actions: { accept: 0, copy: 0, edit: 0, regenerate: 0, abandon: 0 },
        sessions: { averageDuration: 0, averageInteractions: 0, peakHours: [], averageDepth: 0 },
        platforms: { claude: 0, chatgpt: 0, gemini: 0 },
      },
    };
  }
}
