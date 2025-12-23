import db from '../db/connection.js';
import type { ScoreDistribution, ThreeRsScores, ScoreTrend, TrendPoint } from '@corrix/shared';

interface DistributionParams {
  organizationId: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
  bucketSize?: number;
}

interface TrendParams {
  organizationId: string;
  teamId?: string;
  metric: string;
  period: 'day' | 'week' | 'month';
  duration: number;
}

interface BreakdownParams {
  dimension: 'results' | 'relationship' | 'resilience';
  organizationId: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
}

export class ScoreAggregationService {

  async getScoreDistribution(params: DistributionParams): Promise<ScoreDistribution> {
    const { organizationId, teamId, startDate, endDate, bucketSize = 10 } = params;

    // Build query with filters
    const conditions: string[] = ['u.organization_id = $1'];
    const queryParams: (string | number)[] = [organizationId];
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

    const whereClause = conditions.join(' AND ');

    const query = `
      WITH filtered_scores AS (
        SELECT ds.corrix_score
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        WHERE ${whereClause}
          AND ds.corrix_score IS NOT NULL
      ),
      stats AS (
        SELECT
          COALESCE(AVG(corrix_score), 0) as mean,
          COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY corrix_score), 0) as median,
          COALESCE(STDDEV(corrix_score), 0) as stddev,
          COALESCE(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY corrix_score), 0) as p10,
          COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY corrix_score), 0) as p25,
          COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY corrix_score), 0) as p75,
          COALESCE(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY corrix_score), 0) as p90,
          COUNT(*) as total
        FROM filtered_scores
      ),
      buckets AS (
        SELECT
          FLOOR(corrix_score / ${bucketSize}) * ${bucketSize} as bucket_min,
          COUNT(*) as count
        FROM filtered_scores
        GROUP BY bucket_min
        ORDER BY bucket_min
      )
      SELECT
        b.bucket_min,
        b.count,
        s.mean,
        s.median,
        s.stddev,
        s.p10,
        s.p25,
        s.p75,
        s.p90,
        s.total
      FROM buckets b, stats s
    `;

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
    const buckets = result.rows.map(row => ({
      min: parseFloat(row.bucket_min),
      max: parseFloat(row.bucket_min) + bucketSize,
      count: parseInt(row.count),
      percentage: (parseInt(row.count) / total) * 100,
    }));

    return {
      buckets,
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
  }

  async getDimensionalBalance(params: DistributionParams): Promise<ThreeRsScores> {
    const { organizationId, teamId, startDate, endDate } = params;

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

    const query = `
      SELECT
        COALESCE(AVG(results_score), 0) as results,
        COALESCE(AVG(relationship_score), 0) as relationship,
        COALESCE(AVG(resilience_score), 0) as resilience
      FROM daily_scores ds
      JOIN users u ON ds.user_id = u.id
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await db.query(query, queryParams);

    return {
      results: parseFloat(result.rows[0]?.results || 0),
      relationship: parseFloat(result.rows[0]?.relationship || 0),
      resilience: parseFloat(result.rows[0]?.resilience || 0),
    };
  }

  async getDimensionBreakdown(params: BreakdownParams): Promise<Record<string, number>> {
    const { dimension, organizationId, teamId, startDate, endDate } = params;

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

    const columns = {
      results: ['results_outcome_satisfaction', 'results_edit_ratio', 'results_task_completion'],
      relationship: ['relationship_prompt_quality', 'relationship_verification_rate', 'relationship_dialogue_depth', 'relationship_critical_engagement'],
      resilience: ['resilience_skill_trajectory', 'resilience_error_recovery', 'resilience_adaptation'],
    };

    const cols = columns[dimension];
    const selectCols = cols.map(c => `COALESCE(AVG(${c}), 0) as ${c}`).join(', ');

    const query = `
      SELECT ${selectCols}
      FROM daily_scores ds
      JOIN users u ON ds.user_id = u.id
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    const breakdown: Record<string, number> = {};
    for (const col of cols) {
      const key = col.replace(`${dimension}_`, '');
      breakdown[key] = parseFloat(row[col] || 0);
    }

    return breakdown;
  }

  async getScoreTrends(params: TrendParams): Promise<ScoreTrend> {
    const { organizationId, teamId, metric, period, duration } = params;

    const metricColumn = metric === 'corrix' ? 'corrix_score' : `${metric}_score`;
    const dateGroup = period === 'day' ? 'date' :
      period === 'week' ? "DATE_TRUNC('week', date)" :
        "DATE_TRUNC('month', date)";

    const conditions: string[] = ['u.organization_id = $1'];
    const queryParams: string[] = [organizationId];
    let paramIndex = 2;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      queryParams.push(teamId);
    }

    const query = `
      WITH daily_avg AS (
        SELECT
          ${dateGroup} as period_date,
          AVG(${metricColumn}) as avg_score
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        WHERE ${conditions.join(' AND ')}
          AND ds.date >= NOW() - INTERVAL '${duration} ${period}s'
        GROUP BY period_date
        ORDER BY period_date
      ),
      with_ma AS (
        SELECT
          period_date,
          avg_score,
          AVG(avg_score) OVER (ORDER BY period_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
        FROM daily_avg
      )
      SELECT * FROM with_ma
    `;

    const result = await db.query(query, queryParams);

    const points: TrendPoint[] = result.rows.map(row => ({
      date: row.period_date.toISOString().split('T')[0],
      value: parseFloat(row.avg_score),
      movingAverage: parseFloat(row.moving_avg),
    }));

    // Calculate change
    const firstValue = points[0]?.value || 0;
    const lastValue = points[points.length - 1]?.value || 0;
    const absoluteChange = lastValue - firstValue;
    const percentageChange = firstValue !== 0 ? (absoluteChange / firstValue) * 100 : 0;

    return {
      metric,
      period,
      points,
      change: {
        absolute: absoluteChange,
        percentage: percentageChange,
        direction: absoluteChange > 1 ? 'up' : absoluteChange < -1 ? 'down' : 'stable',
      },
    };
  }
}
