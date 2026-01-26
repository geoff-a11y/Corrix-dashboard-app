import db from '../db/connection.js';
import type {
  ScoreDistribution,
  ThreeRsScores,
  ScoreTrend,
  TrendPoint,
  ThreeRsTimePatterns,
  ThreeRsByDayPart,
  ThreeRsByDayOfWeek,
  ThreeRsWithSampleSize,
  ThreeRsTimeInsight,
  DomainScore,
  DomainScoresSubmission,
  DomainScoresResponse,
} from '@corrix/shared';

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

interface DomainScoreParams {
  organizationId: string;
  teamId?: string;
  userId?: string;
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

  /**
   * Get 3R scores broken down by time patterns (day part and day of week)
   */
  async getThreeRsTimePatterns(params: DistributionParams): Promise<ThreeRsTimePatterns> {
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

    const whereClause = conditions.join(' AND ');

    // Query for day part analysis (morning/afternoon/evening based on peak_hour)
    const dayPartQuery = `
      SELECT
        CASE
          WHEN peak_hour >= 6 AND peak_hour < 12 THEN 'morning'
          WHEN peak_hour >= 12 AND peak_hour < 18 THEN 'afternoon'
          ELSE 'evening'
        END as day_part,
        AVG(results_score) as results,
        AVG(relationship_score) as relationship,
        AVG(resilience_score) as resilience,
        COUNT(*) as sample_size
      FROM daily_scores ds
      JOIN users u ON ds.user_id = u.id
      WHERE ${whereClause}
        AND results_score IS NOT NULL
        AND peak_hour IS NOT NULL
      GROUP BY day_part
    `;

    // Query for day of week analysis
    const dayOfWeekQuery = `
      SELECT
        TO_CHAR(date, 'Day') as day_name,
        EXTRACT(DOW FROM date) as day_num,
        AVG(results_score) as results,
        AVG(relationship_score) as relationship,
        AVG(resilience_score) as resilience,
        COUNT(*) as sample_size
      FROM daily_scores ds
      JOIN users u ON ds.user_id = u.id
      WHERE ${whereClause}
        AND results_score IS NOT NULL
      GROUP BY day_name, day_num
      ORDER BY day_num
    `;

    // Query for summary stats
    const summaryQuery = `
      SELECT
        COUNT(*) as total_sessions,
        MIN(date) as start_date,
        MAX(date) as end_date
      FROM daily_scores ds
      JOIN users u ON ds.user_id = u.id
      WHERE ${whereClause}
    `;

    try {
      const [dayPartResult, dayOfWeekResult, summaryResult] = await Promise.all([
        db.query(dayPartQuery, queryParams),
        db.query(dayOfWeekQuery, queryParams),
        db.query(summaryQuery, queryParams),
      ]);

      // Process day part data
      const byDayPart = this.processDayPartData(dayPartResult.rows);

      // Process day of week data
      const byDayOfWeek = this.processDayOfWeekData(dayOfWeekResult.rows);

      // Summary
      const summary = {
        hasEnoughData: (summaryResult.rows[0]?.total_sessions || 0) >= 5,
        totalSessions: parseInt(summaryResult.rows[0]?.total_sessions || 0),
        dateRange: {
          start: summaryResult.rows[0]?.start_date?.toISOString().split('T')[0] || '',
          end: summaryResult.rows[0]?.end_date?.toISOString().split('T')[0] || '',
        },
      };

      return { byDayPart, byDayOfWeek, summary };
    } catch (error) {
      console.error('[ScoreAggregation] Time patterns error:', error);
      return {
        byDayPart: null,
        byDayOfWeek: null,
        summary: { hasEnoughData: false, totalSessions: 0, dateRange: { start: '', end: '' } },
      };
    }
  }

  private processDayPartData(rows: any[]): ThreeRsByDayPart | null {
    if (rows.length < 2) return null;

    const emptyScores: ThreeRsWithSampleSize = { results: 0, relationship: 0, resilience: 0, sampleSize: 0 };
    const result: ThreeRsByDayPart = {
      morning: { ...emptyScores },
      afternoon: { ...emptyScores },
      evening: { ...emptyScores },
      insights: [],
    };

    for (const row of rows) {
      const period = row.day_part as 'morning' | 'afternoon' | 'evening';
      result[period] = {
        results: Math.round(parseFloat(row.results) || 0),
        relationship: Math.round(parseFloat(row.relationship) || 0),
        resilience: Math.round(parseFloat(row.resilience) || 0),
        sampleSize: parseInt(row.sample_size) || 0,
      };
    }

    // Generate insights
    result.insights = this.generateDayPartInsights(result);

    return result;
  }

  private processDayOfWeekData(rows: any[]): ThreeRsByDayOfWeek | null {
    if (rows.length < 3) return null;

    const scores: Record<string, ThreeRsWithSampleSize> = {};

    for (const row of rows) {
      const dayName = row.day_name.trim();
      scores[dayName] = {
        results: Math.round(parseFloat(row.results) || 0),
        relationship: Math.round(parseFloat(row.relationship) || 0),
        resilience: Math.round(parseFloat(row.resilience) || 0),
        sampleSize: parseInt(row.sample_size) || 0,
      };
    }

    const insights = this.generateDayOfWeekInsights(scores);

    return { scores, insights };
  }

  private generateDayPartInsights(data: ThreeRsByDayPart): ThreeRsTimeInsight[] {
    const insights: ThreeRsTimeInsight[] = [];
    const periods = ['morning', 'afternoon', 'evening'] as const;
    const metrics = [
      { key: 'results' as const, name: 'Results', action: 'Schedule verification-heavy tasks' },
      { key: 'relationship' as const, name: 'Relationship', action: 'Do complex prompting work' },
      { key: 'resilience' as const, name: 'Resilience', action: 'Focus on skill-building activities' },
    ];

    for (const metric of metrics) {
      let bestPeriod: typeof periods[number] = periods[0];
      let worstPeriod: typeof periods[number] = periods[0];
      let bestScore = data[bestPeriod][metric.key];
      let worstScore = bestScore;

      for (const period of periods) {
        if (data[period].sampleSize < 2) continue;
        const score = data[period][metric.key];
        if (score > bestScore) {
          bestScore = score;
          bestPeriod = period;
        }
        if (score < worstScore) {
          worstScore = score;
          worstPeriod = period;
        }
      }

      const difference = bestScore - worstScore;

      if (difference >= 8 && bestPeriod !== worstPeriod) {
        insights.push({
          metric: metric.key,
          insight: `${metric.name} score is ${difference} points higher in ${bestPeriod}s`,
          bestTime: bestPeriod,
          worstTime: worstPeriod,
          difference,
          actionable: `${metric.action} for ${bestPeriod}s when ${metric.name} peaks`,
        });
      }
    }

    return insights;
  }

  private generateDayOfWeekInsights(scores: Record<string, ThreeRsWithSampleSize>): ThreeRsTimeInsight[] {
    const insights: ThreeRsTimeInsight[] = [];
    const days = Object.keys(scores);
    const metrics = [
      { key: 'results' as const, name: 'Results', action: 'Schedule high-stakes AI work' },
      { key: 'relationship' as const, name: 'Relationship', action: 'Plan complex prompting sessions' },
      { key: 'resilience' as const, name: 'Resilience', action: 'Do learning and skill-building work' },
    ];

    for (const metric of metrics) {
      let bestDay = days[0];
      let worstDay = days[0];
      let bestScore = scores[bestDay]?.[metric.key] || 0;
      let worstScore = bestScore;

      for (const day of days) {
        if (scores[day].sampleSize < 1) continue;
        const score = scores[day][metric.key];
        if (score > bestScore) {
          bestScore = score;
          bestDay = day;
        }
        if (score < worstScore) {
          worstScore = score;
          worstDay = day;
        }
      }

      const difference = bestScore - worstScore;

      if (difference >= 10 && bestDay !== worstDay) {
        insights.push({
          metric: metric.key,
          insight: `${metric.name} score is ${difference} points higher on ${bestDay}s`,
          bestTime: bestDay,
          worstTime: worstDay,
          difference,
          actionable: `${metric.action} for ${bestDay}s when ${metric.name} peaks`,
        });
      }
    }

    return insights;
  }

  // ============================================================
  // DOMAIN SCORES
  // ============================================================

  async getDomainScores(params: DomainScoreParams): Promise<DomainScoresResponse> {
    const { organizationId, teamId, userId, startDate, endDate } = params;

    // Build query with filters
    const conditions: string[] = ['u.organization_id = $1'];
    const queryParams: (string | number)[] = [organizationId];
    let paramIndex = 2;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      queryParams.push(teamId);
    }
    if (userId) {
      conditions.push(`dds.user_id = $${paramIndex++}`);
      queryParams.push(userId);
    }
    if (startDate) {
      conditions.push(`dds.date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      conditions.push(`dds.date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    // Get latest domain scores grouped by domain
    const query = `
      WITH latest_scores AS (
        SELECT DISTINCT ON (dds.domain_id)
          dds.domain_id,
          dds.domain_name,
          dds.overall,
          dds.results,
          dds.relationship,
          dds.resilience,
          dds.interaction_count,
          dds.trend,
          dds.calculated_at
        FROM domain_daily_scores dds
        JOIN users u ON dds.user_id = u.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY dds.domain_id, dds.date DESC
      )
      SELECT * FROM latest_scores
      ORDER BY overall DESC
    `;

    const result = await db.query(query, queryParams);

    const domains: DomainScore[] = result.rows.map(row => ({
      domainId: row.domain_id,
      domainName: row.domain_name,
      overall: row.overall,
      results: row.results,
      relationship: row.relationship,
      resilience: row.resilience,
      interactionCount: row.interaction_count,
      trend: row.trend,
      calculatedAt: row.calculated_at,
    }));

    // Calculate summary
    const totalDomains = domains.length;
    const averageScore = totalDomains > 0
      ? Math.round(domains.reduce((sum, d) => sum + d.overall, 0) / totalDomains)
      : 0;
    const topPerforming = domains.length > 0 ? domains[0].domainId : null;
    const needsAttention = domains.length > 0 ? domains[domains.length - 1].domainId : null;

    return {
      domains,
      summary: {
        totalDomains,
        averageScore,
        topPerforming,
        needsAttention: needsAttention !== topPerforming ? needsAttention : null,
      },
    };
  }

  async saveDomainScores(submission: DomainScoresSubmission): Promise<void> {
    const { userId, organizationId, teamId, date, domains } = submission;

    // Insert each domain score
    for (const domain of domains) {
      await db.query(`
        INSERT INTO domain_daily_scores (
          user_id, organization_id, team_id, date,
          domain_id, domain_name, overall, results, relationship, resilience,
          interaction_count, trend, calculated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (user_id, domain_id, date)
        DO UPDATE SET
          overall = EXCLUDED.overall,
          results = EXCLUDED.results,
          relationship = EXCLUDED.relationship,
          resilience = EXCLUDED.resilience,
          interaction_count = EXCLUDED.interaction_count,
          trend = EXCLUDED.trend,
          calculated_at = EXCLUDED.calculated_at
      `, [
        userId,
        organizationId || null,
        teamId || null,
        date,
        domain.domainId,
        domain.domainName,
        domain.overall,
        domain.results,
        domain.relationship,
        domain.resilience,
        domain.interactionCount,
        domain.trend,
        domain.calculatedAt,
      ]);
    }
  }
}
