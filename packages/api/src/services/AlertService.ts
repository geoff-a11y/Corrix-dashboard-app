import db from '../db/connection.js';
import { getSupabaseClient } from '../cloud/supabase.js';
import type { Alert, AlertsResponse, Recommendation } from '@corrix/shared';
import { randomUUID } from 'crypto';

interface AlertParams {
  organizationId?: string;
  teamId?: string;
  limit?: number;
}

export class AlertService {
  /**
   * Get alerts aggregated from multiple sources:
   * - Score changes (team dropped >10%)
   * - Engagement declines (users inactive >7 days)
   * - Coaching issues (tip dismissal rate >60%)
   */
  async getAlerts(params: AlertParams): Promise<AlertsResponse> {
    const { organizationId, teamId, limit = 10 } = params;
    const alerts: Alert[] = [];

    // Get score drop alerts
    const scoreAlerts = await this.getScoreDropAlerts(organizationId, teamId);
    alerts.push(...scoreAlerts);

    // Get engagement decline alerts
    const engagementAlerts = await this.getEngagementAlerts(organizationId, teamId);
    alerts.push(...engagementAlerts);

    // Get coaching issue alerts
    const coachingAlerts = await this.getCoachingAlerts(organizationId, teamId);
    alerts.push(...coachingAlerts);

    // Sort by severity and creation date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit
    const limitedAlerts = alerts.slice(0, limit);

    // Calculate summary
    const summary = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };

    return { alerts: limitedAlerts, summary };
  }

  /**
   * Get alerts for teams with significant score drops
   */
  private async getScoreDropAlerts(organizationId?: string, teamId?: string): Promise<Alert[]> {
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`u.organization_id = $${paramIndex++}`);
      params.push(organizationId);
    }
    if (teamId) {
      conditions.push(`t.id = $${paramIndex++}`);
      params.push(teamId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      WITH recent_scores AS (
        SELECT
          t.id as team_id,
          t.name as team_name,
          u.organization_id,
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '7 days'), 0) as recent_score,
          COALESCE(AVG(ds.corrix_score) FILTER (WHERE ds.date >= NOW() - INTERVAL '14 days' AND ds.date < NOW() - INTERVAL '7 days'), 0) as prev_score
        FROM teams t
        JOIN users u ON u.team_id = t.id
        LEFT JOIN daily_scores ds ON ds.user_id = u.id
        ${whereClause}
        GROUP BY t.id, t.name, u.organization_id
      )
      SELECT
        team_id,
        team_name,
        organization_id,
        recent_score,
        prev_score,
        ((recent_score - prev_score) / NULLIF(prev_score, 0)) * 100 as pct_change
      FROM recent_scores
      WHERE prev_score > 0
        AND ((recent_score - prev_score) / prev_score) * 100 < -10
      ORDER BY pct_change ASC
    `;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: randomUUID(),
      severity: parseFloat(row.pct_change) < -20 ? 'critical' : 'warning',
      category: 'score' as const,
      title: `Team score dropped significantly`,
      description: `${row.team_name} has experienced a ${Math.abs(parseFloat(row.pct_change)).toFixed(1)}% decrease in Corrix score over the past week.`,
      metric: {
        name: 'Corrix Score',
        value: parseFloat(row.recent_score),
        change: parseFloat(row.pct_change),
      },
      recommendation: 'Review recent team activities and check for blockers or process changes that may be affecting performance.',
      entityType: 'team' as const,
      entityId: row.team_id,
      entityName: row.team_name,
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Get alerts for users inactive for >7 days
   */
  private async getEngagementAlerts(organizationId?: string, teamId?: string): Promise<Alert[]> {
    const conditions: string[] = ['u.last_seen_at < NOW() - INTERVAL \'7 days\''];
    const params: string[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`u.organization_id = $${paramIndex++}`);
      params.push(organizationId);
    }
    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      params.push(teamId);
    }

    const query = `
      SELECT
        u.id as user_id,
        u.anonymous_id,
        u.team_id,
        t.name as team_name,
        u.organization_id,
        u.last_seen_at,
        EXTRACT(DAY FROM NOW() - u.last_seen_at) as days_inactive
      FROM users u
      LEFT JOIN teams t ON t.id = u.team_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.last_seen_at ASC
      LIMIT 20
    `;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: randomUUID(),
      severity: parseInt(row.days_inactive) > 14 ? 'warning' : 'info',
      category: 'engagement' as const,
      title: `User inactive for ${row.days_inactive} days`,
      description: `User ${row.anonymous_id} from ${row.team_name || 'Unknown Team'} has not been active for ${row.days_inactive} days.`,
      recommendation: 'Consider reaching out to understand barriers to engagement or provide additional training resources.',
      entityType: 'user' as const,
      entityId: row.user_id,
      entityName: row.anonymous_id,
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Get alerts for coaching tips with high dismissal rates
   */
  private async getCoachingAlerts(organizationId?: string, teamId?: string): Promise<Alert[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return [];
    }

    try {
      let query = supabase
        .from('coaching_tip_actions')
        .select('coaching_type, action_taken, org_id');

      if (organizationId) {
        query = query.eq('org_id', organizationId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return [];
      }

      // Group by coaching type and calculate dismissal rates
      const typeStats: Record<string, { total: number; dismissed: number }> = {};

      data.forEach(action => {
        if (!typeStats[action.coaching_type]) {
          typeStats[action.coaching_type] = { total: 0, dismissed: 0 };
        }
        typeStats[action.coaching_type].total++;
        if (action.action_taken === 'dismissed') {
          typeStats[action.coaching_type].dismissed++;
        }
      });

      // Create alerts for high dismissal rates
      const alerts: Alert[] = [];
      Object.entries(typeStats).forEach(([coachingType, stats]) => {
        const dismissalRate = (stats.dismissed / stats.total) * 100;
        if (dismissalRate > 60 && stats.total >= 5) {
          alerts.push({
            id: randomUUID(),
            severity: dismissalRate > 80 ? 'warning' : 'info',
            category: 'coaching' as const,
            title: `High dismissal rate for ${coachingType} coaching`,
            description: `${dismissalRate.toFixed(1)}% of ${coachingType} coaching tips are being dismissed (${stats.dismissed}/${stats.total} shown).`,
            metric: {
              name: 'Dismissal Rate',
              value: dismissalRate,
              change: 0,
            },
            recommendation: 'Consider refining the coaching tip content or targeting criteria to improve relevance.',
            entityType: organizationId ? 'organization' : 'team' as const,
            entityId: organizationId || teamId || 'unknown',
            entityName: coachingType,
            createdAt: new Date().toISOString(),
          });
        }
      });

      return alerts;
    } catch (error) {
      console.error('[AlertService] Error fetching coaching alerts:', error);
      return [];
    }
  }

  /**
   * Get top actionable recommendations
   */
  async getRecommendations(params: AlertParams): Promise<Recommendation[]> {
    const { organizationId, teamId, limit = 5 } = params;
    const recommendations: Recommendation[] = [];

    // Get teams with low scores that could benefit from coaching
    const lowScoreTeams = await this.getLowScoreTeamRecommendations(organizationId, teamId);
    recommendations.push(...lowScoreTeams);

    // Get users who would benefit from re-engagement
    const reengagementUsers = await this.getReengagementRecommendations(organizationId, teamId);
    recommendations.push(...reengagementUsers);

    // Sort by priority and apply limit
    recommendations.sort((a, b) => a.priority - b.priority);
    return recommendations.slice(0, limit);
  }

  private async getLowScoreTeamRecommendations(organizationId?: string, teamId?: string): Promise<Recommendation[]> {
    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`u.organization_id = $${paramIndex++}`);
      params.push(organizationId);
    }
    if (teamId) {
      conditions.push(`t.id = $${paramIndex++}`);
      params.push(teamId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        t.id as team_id,
        t.name as team_name,
        COALESCE(AVG(ds.corrix_score), 0) as avg_score,
        COUNT(DISTINCT u.id) as user_count
      FROM teams t
      JOIN users u ON u.team_id = t.id
      LEFT JOIN daily_scores ds ON ds.user_id = u.id AND ds.date >= NOW() - INTERVAL '7 days'
      ${whereClause}
      GROUP BY t.id, t.name
      HAVING COALESCE(AVG(ds.corrix_score), 0) < 50
      ORDER BY avg_score ASC
      LIMIT 3
    `;

    const result = await db.query(query, params);

    return result.rows.map((row, index) => ({
      id: randomUUID(),
      priority: index + 1,
      title: `Boost ${row.team_name} team performance`,
      description: `Team is scoring below average (${parseFloat(row.avg_score).toFixed(1)}/100). Consider organizing a training session or one-on-one coaching.`,
      actionUrl: `/teams/${row.team_id}/analytics`,
      entityType: 'team' as const,
      entityId: row.team_id,
    }));
  }

  private async getReengagementRecommendations(organizationId?: string, teamId?: string): Promise<Recommendation[]> {
    const conditions: string[] = ['u.last_seen_at < NOW() - INTERVAL \'14 days\''];
    const params: string[] = [];
    let paramIndex = 1;

    if (organizationId) {
      conditions.push(`u.organization_id = $${paramIndex++}`);
      params.push(organizationId);
    }
    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      params.push(teamId);
    }

    const query = `
      SELECT
        u.id as user_id,
        u.anonymous_id,
        u.team_id,
        EXTRACT(DAY FROM NOW() - u.last_seen_at) as days_inactive
      FROM users u
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.last_seen_at ASC
      LIMIT 5
    `;

    const result = await db.query(query, params);

    return result.rows.map((row, index) => ({
      id: randomUUID(),
      priority: index + 10, // Lower priority than team recommendations
      title: `Re-engage inactive user`,
      description: `User ${row.anonymous_id} has been inactive for ${row.days_inactive} days. Reach out to understand barriers and provide support.`,
      actionUrl: `/users/${row.user_id}`,
      entityType: 'user' as const,
      entityId: row.user_id,
    }));
  }
}
