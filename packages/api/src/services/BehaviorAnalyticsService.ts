import db from '../db/connection.js';
import type { ScoreDistribution, BehaviorMetrics } from '@corrix/shared';

interface QueryParams {
  organizationId: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CollaborationModeAnalytics {
  modes: {
    mode: string;
    displayName: string;
    percentage: number;
    avgScore: number;
    count: number;
  }[];
  totalInteractions: number;
}

export class BehaviorAnalyticsService {

  async getPromptQualityDistribution(params: QueryParams): Promise<ScoreDistribution> {
    const { organizationId, teamId, startDate, endDate } = params;

    // First try to use daily_scores relationship_prompt_quality as a proxy for prompt quality
    const conditions: string[] = ['u.organization_id = $1'];
    const queryParams: string[] = [organizationId];
    let paramIndex = 2;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      queryParams.push(teamId);
    }
    if (startDate) {
      conditions.push(`ds.date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      conditions.push(`ds.date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    // Use daily_scores as the data source (relationship_prompt_quality as proxy)
    const query = `
      WITH filtered AS (
        SELECT ds.relationship_prompt_quality * 100 as prompt_quality_score
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        WHERE ${conditions.join(' AND ')}
          AND ds.relationship_prompt_quality IS NOT NULL
      ),
      stats AS (
        SELECT
          COALESCE(AVG(prompt_quality_score), 0) as mean,
          COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY prompt_quality_score), 0) as median,
          COALESCE(STDDEV(prompt_quality_score), 0) as stddev,
          COALESCE(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY prompt_quality_score), 0) as p10,
          COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY prompt_quality_score), 0) as p25,
          COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY prompt_quality_score), 0) as p75,
          COALESCE(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY prompt_quality_score), 0) as p90,
          COUNT(*) as total
        FROM filtered
      ),
      buckets AS (
        SELECT
          FLOOR(prompt_quality_score / 10) * 10 as bucket_min,
          COUNT(*) as count
        FROM filtered
        GROUP BY bucket_min
        ORDER BY bucket_min
      )
      SELECT b.*, s.* FROM buckets b, stats s
    `;

    try {
      const result = await db.query(query, queryParams);

      if (result.rows.length === 0) {
        return {
          buckets: [],
          mean: 0,
          median: 0,
          standardDeviation: 0,
          percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 },
        };
      }

      const total = parseInt(result.rows[0].total) || 1;
      return {
        buckets: result.rows.map(row => ({
          min: parseFloat(row.bucket_min),
          max: parseFloat(row.bucket_min) + 10,
          count: parseInt(row.count),
          percentage: (parseInt(row.count) / total) * 100,
        })),
        mean: parseFloat(result.rows[0].mean),
        median: parseFloat(result.rows[0].median),
        standardDeviation: parseFloat(result.rows[0].stddev),
        percentiles: {
          p10: parseFloat(result.rows[0].p10),
          p25: parseFloat(result.rows[0].p25),
          p50: parseFloat(result.rows[0].median),
          p75: parseFloat(result.rows[0].p75),
          p90: parseFloat(result.rows[0].p90),
        },
      };
    } catch (error) {
      console.error('[BehaviorAnalyticsService] Prompt quality query failed:', error);
      return {
        buckets: [],
        mean: 0,
        median: 0,
        standardDeviation: 0,
        percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 },
      };
    }
  }

  async getActionDistribution(params: QueryParams): Promise<BehaviorMetrics['actions']> {
    // No behavioral_signals data available yet - return empty distribution
    // In future, this could be populated from extension signal sync
    const actions: BehaviorMetrics['actions'] = {
      accept: 0,
      copy: 0,
      edit: 0,
      regenerate: 0,
      abandon: 0,
    };

    // Try to query behavioral_signals if they exist
    try {
      const { organizationId, teamId, startDate, endDate } = params;

      const conditions: string[] = ['u.organization_id = $1'];
      const queryParams: string[] = [organizationId];
      let paramIndex = 2;

      if (teamId) {
        conditions.push(`u.team_id = $${paramIndex++}`);
        queryParams.push(teamId);
      }
      if (startDate) {
        conditions.push(`bs.timestamp >= $${paramIndex++}`);
        queryParams.push(startDate);
      }
      if (endDate) {
        conditions.push(`bs.timestamp <= $${paramIndex++}`);
        queryParams.push(endDate);
      }

      const query = `
        SELECT
          action_type,
          COUNT(*) as count,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
          AND action_type IS NOT NULL
        GROUP BY action_type
      `;

      const result = await db.query(query, queryParams);

      for (const row of result.rows) {
        const type = row.action_type as keyof typeof actions;
        if (type in actions) {
          actions[type] = parseFloat(row.percentage);
        }
      }
    } catch (error) {
      console.log('[BehaviorAnalyticsService] No behavioral_signals data available');
    }

    return actions;
  }

  async getSessionAnalytics(params: QueryParams): Promise<BehaviorMetrics['sessions']> {
    // Session-level data requires behavioral_signals which aren't currently synced
    // Return default empty values
    const defaultSession = {
      averageDuration: 0,
      averageInteractions: 0,
      peakHours: [],
      averageDepth: 0,
    };

    try {
      const { organizationId, teamId, startDate, endDate } = params;

      const conditions: string[] = ['u.organization_id = $1'];
      const queryParams: string[] = [organizationId];
      let paramIndex = 2;

      if (teamId) {
        conditions.push(`u.team_id = $${paramIndex++}`);
        queryParams.push(teamId);
      }
      if (startDate) {
        conditions.push(`bs.timestamp >= $${paramIndex++}`);
        queryParams.push(startDate);
      }
      if (endDate) {
        conditions.push(`bs.timestamp <= $${paramIndex++}`);
        queryParams.push(endDate);
      }

      const query = `
        SELECT
          COALESCE(AVG(session_duration_seconds), 0) as avg_duration,
          COALESCE(AVG(conversation_depth), 0) as avg_depth,
          MODE() WITHIN GROUP (ORDER BY session_start_hour) as peak_hour
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
      `;

      const result = await db.query(query, queryParams);
      const row = result.rows[0] || {};

      return {
        averageDuration: parseFloat(row.avg_duration || 0),
        averageInteractions: 0,
        peakHours: row.peak_hour ? [parseInt(row.peak_hour)] : [],
        averageDepth: parseFloat(row.avg_depth || 0),
      };
    } catch (error) {
      console.log('[BehaviorAnalyticsService] No session data available');
      return defaultSession;
    }
  }

  async getPlatformAnalytics(params: QueryParams): Promise<BehaviorMetrics['platforms']> {
    // Platform data requires behavioral_signals which aren't currently synced
    const platforms: BehaviorMetrics['platforms'] = {
      claude: 0,
      chatgpt: 0,
      gemini: 0,
    };

    try {
      const { organizationId, teamId, startDate, endDate } = params;

      const conditions: string[] = ['u.organization_id = $1'];
      const queryParams: string[] = [organizationId];
      let paramIndex = 2;

      if (teamId) {
        conditions.push(`u.team_id = $${paramIndex++}`);
        queryParams.push(teamId);
      }
      if (startDate) {
        conditions.push(`bs.timestamp >= $${paramIndex++}`);
        queryParams.push(startDate);
      }
      if (endDate) {
        conditions.push(`bs.timestamp <= $${paramIndex++}`);
        queryParams.push(endDate);
      }

      const query = `
        SELECT
          platform,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
        GROUP BY platform
      `;

      const result = await db.query(query, queryParams);

      for (const row of result.rows) {
        const platform = row.platform as keyof typeof platforms;
        if (platform in platforms) {
          platforms[platform] = parseFloat(row.percentage);
        }
      }
    } catch (error) {
      console.log('[BehaviorAnalyticsService] No platform data available');
    }

    return platforms;
  }

  async getCollaborationModeAnalytics(params: QueryParams): Promise<CollaborationModeAnalytics> {
    // Collaboration mode data requires behavioral_signals which aren't currently synced
    const emptyResult: CollaborationModeAnalytics = {
      modes: [],
      totalInteractions: 0,
    };

    try {
      const { organizationId, teamId, userId, startDate, endDate } = params;

      const conditions: string[] = ['u.organization_id = $1'];
      const queryParams: string[] = [organizationId];
      let paramIndex = 2;

      if (teamId) {
        conditions.push(`u.team_id = $${paramIndex++}`);
        queryParams.push(teamId);
      }
      if (userId) {
        conditions.push(`bs.user_id = $${paramIndex++}`);
        queryParams.push(userId);
      }
      if (startDate) {
        conditions.push(`bs.timestamp >= $${paramIndex++}`);
        queryParams.push(startDate);
      }
      if (endDate) {
        conditions.push(`bs.timestamp <= $${paramIndex++}`);
        queryParams.push(endDate);
      }

      const query = `
        WITH filtered AS (
          SELECT
            bs.collaboration_mode,
            bs.prompt_quality_score,
            bs.session_duration_seconds,
            ds.corrix_score
          FROM behavioral_signals bs
          JOIN users u ON bs.user_id = u.id
          LEFT JOIN daily_scores ds ON bs.user_id = ds.user_id AND DATE(bs.timestamp) = ds.date
          WHERE ${conditions.join(' AND ')}
            AND bs.collaboration_mode IS NOT NULL
        ),
        mode_stats AS (
          SELECT
            collaboration_mode,
            COUNT(*) as count,
            COALESCE(AVG(prompt_quality_score), 0) as avg_prompt_quality,
            COALESCE(AVG(corrix_score), 0) as avg_score,
            COALESCE(SUM(session_duration_seconds), 0) as total_duration
          FROM filtered
          GROUP BY collaboration_mode
        ),
        totals AS (
          SELECT
            SUM(count) as total_count,
            SUM(total_duration) as total_duration
          FROM mode_stats
        )
        SELECT
          ms.collaboration_mode,
          ms.count,
          ms.avg_score,
          ms.avg_prompt_quality,
          ms.total_duration,
          CASE WHEN t.total_duration > 0
            THEN (ms.total_duration * 100.0 / t.total_duration)
            ELSE 0
          END as percentage,
          t.total_count
        FROM mode_stats ms, totals t
        ORDER BY ms.total_duration DESC
      `;

      const result = await db.query(query, queryParams);

      const modeDisplayNames: Record<string, string> = {
        approving: 'Approving',
        consulting: 'Consulting',
        supervising: 'Supervising',
        delegating: 'Delegating',
      };

      if (result.rows.length === 0) {
        return emptyResult;
      }

      return {
        modes: result.rows.map(row => ({
          mode: row.collaboration_mode,
          displayName: modeDisplayNames[row.collaboration_mode] || row.collaboration_mode,
          percentage: parseFloat(row.percentage),
          avgScore: parseFloat(row.avg_score),
          count: parseInt(row.count),
        })),
        totalInteractions: parseInt(result.rows[0].total_count) || 0,
      };
    } catch (error) {
      console.log('[BehaviorAnalyticsService] No collaboration mode data available');
      return emptyResult;
    }
  }
}
