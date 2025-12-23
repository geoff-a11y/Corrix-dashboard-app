import db from '../db/connection.js';
import type {
  TemporalIndicatorDashboard,
  TemporalIndicator,
  IndicatorTrend,
  LeadingIndicatorAlert,
  Dimension,
  Temporality,
  TrendDirection,
} from '@corrix/shared';

interface QueryParams {
  organizationId: string;
  teamId?: string;
  userId?: string;
  date?: string;
}

export class TemporalIndicatorService {

  /**
   * Get complete temporal indicator dashboard
   * Capability #6
   */
  async getIndicatorDashboard(params: QueryParams): Promise<TemporalIndicatorDashboard> {
    const { organizationId, teamId, userId, date = new Date().toISOString().split('T')[0] } = params;

    const conditions: string[] = ['u.organization_id = $1', 'ti.date = $2', 'id.is_active = true'];
    const queryParams: (string | undefined)[] = [organizationId, date];
    let paramIndex = 3;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      queryParams.push(teamId);
    }
    if (userId) {
      conditions.push(`ti.user_id = $${paramIndex++}`);
      queryParams.push(userId);
    }

    const query = `
      SELECT
        ti.indicator_name,
        id.display_name,
        id.description,
        ti.dimension,
        ti.temporality::text,
        COALESCE(AVG(ti.current_value), 0) as current_value,
        COALESCE(AVG(ti.baseline_value), 0) as baseline_value,
        COALESCE(AVG(ti.population_value), 0) as population_value,
        COALESCE(AVG(ti.deviation_from_baseline), 0) as deviation_from_baseline,
        COALESCE(AVG(ti.deviation_from_population), 0) as deviation_from_population,
        COALESCE(AVG(ti.percentile_rank), 50) as percentile_rank,
        MODE() WITHIN GROUP (ORDER BY ti.trend_direction) as trend_direction,
        COALESCE(AVG(ti.trend_velocity), 0) as trend_velocity,
        id.warning_threshold_low,
        id.warning_threshold_high,
        id.critical_threshold_low,
        id.critical_threshold_high,
        id.color_scheme,
        id.icon,
        id.display_order
      FROM temporal_indicators ti
      JOIN indicator_definitions id ON ti.indicator_name = id.name
      JOIN users u ON ti.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY ti.indicator_name, id.display_name, id.description, ti.dimension, ti.temporality,
               id.warning_threshold_low, id.warning_threshold_high,
               id.critical_threshold_low, id.critical_threshold_high,
               id.color_scheme, id.icon, id.display_order
      ORDER BY id.display_order
    `;

    const result = await db.query(query, queryParams.filter(p => p !== undefined));

    // Group by temporality
    const leading: TemporalIndicator[] = [];
    const concurrent: TemporalIndicator[] = [];
    const lagging: TemporalIndicator[] = [];

    for (const row of result.rows) {
      const indicator: TemporalIndicator = {
        name: row.indicator_name,
        displayName: row.display_name,
        dimension: row.dimension as Dimension,
        temporality: row.temporality as Temporality,
        currentValue: parseFloat(row.current_value),
        baselineValue: parseFloat(row.baseline_value),
        populationValue: parseFloat(row.population_value),
        deviationFromBaseline: parseFloat(row.deviation_from_baseline),
        deviationFromPopulation: parseFloat(row.deviation_from_population),
        percentileRank: parseFloat(row.percentile_rank),
        trendDirection: (row.trend_direction || 'stable') as TrendDirection,
        trendVelocity: parseFloat(row.trend_velocity),
        warningThreshold: {
          low: row.warning_threshold_low ? parseFloat(row.warning_threshold_low) : undefined,
          high: row.warning_threshold_high ? parseFloat(row.warning_threshold_high) : undefined,
        },
        criticalThreshold: {
          low: row.critical_threshold_low ? parseFloat(row.critical_threshold_low) : undefined,
          high: row.critical_threshold_high ? parseFloat(row.critical_threshold_high) : undefined,
        },
        status: this.calculateStatus(row),
      };

      switch (row.temporality) {
        case 'leading':
          leading.push(indicator);
          break;
        case 'concurrent':
          concurrent.push(indicator);
          break;
        case 'lagging':
          lagging.push(indicator);
          break;
      }
    }

    // Calculate summary health scores
    const calculateHealth = (indicators: TemporalIndicator[]): number => {
      if (indicators.length === 0) return 100;
      const normalCount = indicators.filter(i => i.status === 'normal').length;
      return (normalCount / indicators.length) * 100;
    };

    const allIndicators = [...leading, ...concurrent, ...lagging];
    const alertCounts = {
      warning: allIndicators.filter(i => i.status === 'warning').length,
      critical: allIndicators.filter(i => i.status === 'critical').length,
    };

    return {
      date,
      leading,
      concurrent,
      lagging,
      summary: {
        leadingHealth: calculateHealth(leading),
        concurrentHealth: calculateHealth(concurrent),
        laggingHealth: calculateHealth(lagging),
        overallHealth: calculateHealth(allIndicators),
        alertCount: alertCounts,
      },
    };
  }

  /**
   * Get trend data for a specific indicator
   */
  async getIndicatorTrend(params: {
    indicatorName: string;
    organizationId: string;
    teamId?: string;
    userId?: string;
    days: number;
  }): Promise<IndicatorTrend> {
    const { indicatorName, organizationId, teamId, userId, days } = params;

    const conditions: string[] = [
      'ti.indicator_name = $1',
      'u.organization_id = $2',
      `ti.date >= CURRENT_DATE - INTERVAL '${days} days'`,
    ];
    const queryParams: (string | undefined)[] = [indicatorName, organizationId];
    let paramIndex = 3;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      queryParams.push(teamId);
    }
    if (userId) {
      conditions.push(`ti.user_id = $${paramIndex++}`);
      queryParams.push(userId);
    }

    const query = `
      SELECT
        ti.date,
        AVG(ti.current_value) as value,
        AVG(ti.baseline_value) as baseline,
        AVG(ti.population_value) as population
      FROM temporal_indicators ti
      JOIN users u ON ti.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY ti.date
      ORDER BY ti.date ASC
    `;

    const result = await db.query(query, queryParams.filter(p => p !== undefined));

    const points = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      value: parseFloat(row.value),
      baseline: parseFloat(row.baseline),
      population: parseFloat(row.population),
    }));

    // Calculate overall trend
    const firstValue = points[0]?.value || 0;
    const lastValue = points[points.length - 1]?.value || 0;
    const change = lastValue - firstValue;

    // Calculate correlation with Results (for leading indicators)
    const correlationQuery = `
      SELECT CORR(ti.current_value, ds.results_score) as correlation
      FROM temporal_indicators ti
      JOIN daily_scores ds ON ti.user_id = ds.user_id AND ti.date = ds.date - INTERVAL '7 days'
      WHERE ti.indicator_name = $1
    `;

    const corrResult = await db.query(correlationQuery, [indicatorName]);

    return {
      indicatorName,
      points,
      overallTrend: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      correlationWithOutcomes: parseFloat(corrResult.rows[0]?.correlation || '0'),
    };
  }

  /**
   * Get leading indicators that are in warning/critical state
   */
  async getLeadingIndicatorAlerts(params: {
    organizationId: string;
    teamId?: string;
    severity?: 'warning' | 'critical';
  }): Promise<LeadingIndicatorAlert[]> {
    const dashboard = await this.getIndicatorDashboard({
      organizationId: params.organizationId,
      teamId: params.teamId,
    });

    const alerts: LeadingIndicatorAlert[] = [];

    for (const indicator of dashboard.leading) {
      if (indicator.status === 'normal') continue;
      if (params.severity && indicator.status !== params.severity) continue;

      alerts.push({
        indicator,
        userId: '', // Aggregate view
        teamId: params.teamId,
        alertType: indicator.status as 'warning' | 'critical',
        message: this.generateAlertMessage(indicator),
        recommendation: this.generateRecommendation(indicator),
        triggeredAt: new Date().toISOString(),
      });
    }

    return alerts;
  }

  /**
   * Get correlation matrix between leading and lagging indicators
   */
  async getIndicatorCorrelations(params: { organizationId: string }): Promise<{
    correlations: Array<{
      leadingIndicator: string;
      laggingIndicator: string;
      correlation: number;
      lag: number;
    }>;
  }> {
    const query = `
      SELECT
        ti_lead.indicator_name as leading_indicator,
        ti_lag.indicator_name as lagging_indicator,
        CORR(ti_lead.current_value, ti_lag.current_value) as correlation
      FROM temporal_indicators ti_lead
      JOIN temporal_indicators ti_lag ON ti_lead.user_id = ti_lag.user_id
        AND ti_lead.date = ti_lag.date - INTERVAL '7 days'
      JOIN users u ON ti_lead.user_id = u.id
      JOIN indicator_definitions id_lead ON ti_lead.indicator_name = id_lead.name
      JOIN indicator_definitions id_lag ON ti_lag.indicator_name = id_lag.name
      WHERE u.organization_id = $1
        AND id_lead.temporality = 'leading'
        AND id_lag.temporality = 'lagging'
      GROUP BY ti_lead.indicator_name, ti_lag.indicator_name
      HAVING CORR(ti_lead.current_value, ti_lag.current_value) IS NOT NULL
      ORDER BY ABS(CORR(ti_lead.current_value, ti_lag.current_value)) DESC
    `;

    const result = await db.query(query, [params.organizationId]);

    return {
      correlations: result.rows.map(row => ({
        leadingIndicator: row.leading_indicator,
        laggingIndicator: row.lagging_indicator,
        correlation: parseFloat(row.correlation),
        lag: 7, // Days
      })),
    };
  }

  private calculateStatus(row: {
    current_value: string;
    critical_threshold_low?: string;
    critical_threshold_high?: string;
    warning_threshold_low?: string;
    warning_threshold_high?: string;
  }): 'normal' | 'warning' | 'critical' {
    const value = parseFloat(row.current_value);

    if (row.critical_threshold_low && value < parseFloat(row.critical_threshold_low)) return 'critical';
    if (row.critical_threshold_high && value > parseFloat(row.critical_threshold_high)) return 'critical';
    if (row.warning_threshold_low && value < parseFloat(row.warning_threshold_low)) return 'warning';
    if (row.warning_threshold_high && value > parseFloat(row.warning_threshold_high)) return 'warning';

    return 'normal';
  }

  private generateAlertMessage(indicator: TemporalIndicator): string {
    const messages: Record<string, string> = {
      fatigue_level: 'Fatigue levels are elevated, which may impact quality',
      prompt_sophistication_trend: 'Prompt quality is declining',
      sustainable_pace: 'Work pace may not be sustainable',
    };
    return messages[indicator.name] || `${indicator.displayName} requires attention`;
  }

  private generateRecommendation(indicator: TemporalIndicator): string {
    const recommendations: Record<string, string> = {
      fatigue_level: 'Consider encouraging breaks or workload redistribution',
      prompt_sophistication_trend: 'Review training materials on effective prompting',
      sustainable_pace: 'Monitor for burnout indicators',
    };
    return recommendations[indicator.name] || 'Review indicator trends and take appropriate action';
  }
}
