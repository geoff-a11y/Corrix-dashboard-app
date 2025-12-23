import db from '../db/connection.js';
import type { OrganizationAnalytics, AdoptionMetrics } from '@corrix/shared';

interface AdoptionParams {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  granularity: 'day' | 'week' | 'month';
}

export class OrganizationService {

  async getOrganizationSummary(organizationId: string): Promise<OrganizationAnalytics['summary']> {
    const query = `
      WITH user_stats AS (
        SELECT
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN ds.date >= NOW() - INTERVAL '7 days' THEN u.id END) as active_users
        FROM users u
        LEFT JOIN daily_scores ds ON ds.user_id = u.id
        WHERE u.organization_id = $1
      ),
      team_count AS (
        SELECT COUNT(*) as total_teams
        FROM teams
        WHERE organization_id = $1
      ),
      score_stats AS (
        SELECT
          COALESCE(AVG(ds.corrix_score), 0) as avg_score,
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '7 days'), 0) -
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '14 days' AND ds.date < NOW() - INTERVAL '7 days'), 0) as change_7d,
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '30 days'), 0) -
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '60 days' AND ds.date < NOW() - INTERVAL '30 days'), 0) as change_30d
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        WHERE u.organization_id = $1
      )
      SELECT
        us.total_users,
        us.active_users,
        tc.total_teams,
        ss.avg_score,
        ss.change_7d,
        ss.change_30d
      FROM user_stats us, team_count tc, score_stats ss
    `;

    const result = await db.query(query, [organizationId]);
    const row = result.rows[0] || {};

    return {
      totalUsers: parseInt(row.total_users || 0),
      activeUsers: parseInt(row.active_users || 0),
      totalTeams: parseInt(row.total_teams || 0),
      averageCorrixScore: parseFloat(row.avg_score || 0),
      scoreChange7d: parseFloat(row.change_7d || 0),
      scoreChange30d: parseFloat(row.change_30d || 0),
    };
  }

  async getAdoptionMetrics(params: AdoptionParams): Promise<AdoptionMetrics> {
    const { organizationId, granularity } = params;

    const dateGroup = granularity === 'day' ? 'DATE(first_seen_at)' :
      granularity === 'week' ? "DATE_TRUNC('week', first_seen_at)" :
        "DATE_TRUNC('month', first_seen_at)";

    // Cumulative users over time
    const cumulativeQuery = `
      SELECT
        ${dateGroup} as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY ${dateGroup}) as total_users
      FROM users
      WHERE organization_id = $1
      GROUP BY ${dateGroup}
      ORDER BY date
    `;

    const cumulativeResult = await db.query(cumulativeQuery, [organizationId]);

    // Team adoption
    const teamQuery = `
      SELECT
        t.id as team_id,
        t.name as team_name,
        COUNT(u.id) as adopted_members,
        MIN(u.first_seen_at) as first_adoption,
        MAX(u.first_seen_at) as latest_adoption
      FROM teams t
      LEFT JOIN users u ON u.team_id = t.id
      WHERE t.organization_id = $1
      GROUP BY t.id, t.name
    `;

    const teamResult = await db.query(teamQuery, [organizationId]);

    // Velocity
    const velocityQuery = `
      SELECT
        COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '7 days') as last_7d,
        COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '30 days') as last_30d,
        COUNT(*) FILTER (WHERE first_seen_at >= NOW() - INTERVAL '90 days') as last_90d,
        COUNT(*) / NULLIF(EXTRACT(EPOCH FROM (MAX(first_seen_at) - MIN(first_seen_at))) / 604800, 0) as avg_per_week
      FROM users
      WHERE organization_id = $1
    `;

    const velocityResult = await db.query(velocityQuery, [organizationId]);
    const velocity = velocityResult.rows[0] || {};

    return {
      cumulativeUsers: cumulativeResult.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        totalUsers: parseInt(row.total_users),
        activeUsers: parseInt(row.total_users), // Simplified
      })),
      teamAdoption: teamResult.rows.map(row => ({
        teamId: row.team_id,
        teamName: row.team_name,
        totalMembers: 0, // Would need team size from external source
        adoptedMembers: parseInt(row.adopted_members),
        adoptionRate: 0,
        firstAdoptionDate: row.first_adoption?.toISOString() || '',
        latestAdoptionDate: row.latest_adoption?.toISOString() || '',
      })),
      velocity: {
        last7Days: parseInt(velocity.last_7d || 0),
        last30Days: parseInt(velocity.last_30d || 0),
        last90Days: parseInt(velocity.last_90d || 0),
        averagePerWeek: parseFloat(velocity.avg_per_week || 0),
      },
      timeToFirstUse: {
        mean: 0,
        median: 0,
        p90: 0,
      },
    };
  }
}
