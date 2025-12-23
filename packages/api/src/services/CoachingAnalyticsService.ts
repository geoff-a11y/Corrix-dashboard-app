import db from '../db/connection.js';
import type {
  AdvancedCoachingType,
  DreyfusStage,
  BehaviorProfile,
  CoachingEffectivenessStats,
  CoachingTypeAnalytics,
  CoachingAnalyticsSummary,
  EffectivenessMatrix,
  EffectivenessMatrixCell,
  CoachingRecommendation,
  CoachingAnalyticsResponse,
  COACHING_TYPE_DISPLAY,
  ConfidenceLevel,
  TrendDirection,
} from '@corrix/shared';

// ============================================================================
// Types
// ============================================================================

interface QueryParams {
  organizationId?: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  coachingTypes?: AdvancedCoachingType[];
}

// ============================================================================
// Service
// ============================================================================

export class CoachingAnalyticsService {

  // ===========================================================================
  // Main Analytics Query
  // ===========================================================================

  async getCoachingAnalytics(params: QueryParams): Promise<CoachingAnalyticsResponse> {
    const [summary, byType, matrix, recommendations] = await Promise.all([
      this.getSummary(params),
      this.getByType(params),
      this.getEffectivenessMatrix(params),
      this.getRecommendations(params),
    ]);

    return {
      summary,
      byType,
      matrix,
      recommendations,
      scope: this.determineScope(params),
    };
  }

  // ===========================================================================
  // Summary
  // ===========================================================================

  async getSummary(params: QueryParams): Promise<CoachingAnalyticsSummary> {
    const { conditions, queryParams } = this.buildConditions(params);

    const query = `
      WITH filtered AS (
        SELECT
          coaching_type,
          action_taken,
          next_prompt_improved
        FROM coaching_outcomes
        WHERE ${conditions.join(' AND ')}
      ),
      totals AS (
        SELECT
          COUNT(*) as total_shown,
          COUNT(*) FILTER (WHERE action_taken = 'injected_prompt') as acted_upon,
          COUNT(*) FILTER (WHERE action_taken = 'thumbs_up') as thumbs_up,
          COUNT(*) FILTER (WHERE action_taken IN ('dismissed', 'clicked_away')) as dismissed,
          COUNT(*) FILTER (WHERE action_taken = 'thumbs_down') as thumbs_down,
          COUNT(*) FILTER (WHERE next_prompt_improved = true) as improved,
          COUNT(*) FILTER (WHERE next_prompt_improved = false) as not_improved
        FROM filtered
      ),
      by_type AS (
        SELECT
          coaching_type,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE action_taken = 'injected_prompt' OR action_taken = 'thumbs_up') as positive
        FROM filtered
        GROUP BY coaching_type
      ),
      top_effective AS (
        SELECT coaching_type, total, positive,
          CASE WHEN total > 0 THEN positive::float / total ELSE 0 END as effectiveness_rate
        FROM by_type
        WHERE total >= 5
        ORDER BY effectiveness_rate DESC
        LIMIT 5
      ),
      low_performers AS (
        SELECT coaching_type, total,
          CASE WHEN total > 0 THEN positive::float / total ELSE 0 END as effectiveness_rate,
          CASE WHEN total > 0 THEN
            (SELECT COUNT(*) FROM filtered f2
             WHERE f2.coaching_type = by_type.coaching_type
               AND f2.action_taken IN ('dismissed', 'clicked_away'))::float / total
          ELSE 0 END as dismissal_rate
        FROM by_type
        WHERE total >= 10
        ORDER BY effectiveness_rate ASC
        LIMIT 5
      )
      SELECT
        t.*,
        json_agg(DISTINCT jsonb_build_object(
          'coaching_type', te.coaching_type,
          'effectiveness_rate', te.effectiveness_rate,
          'sample_size', te.total
        )) FILTER (WHERE te.coaching_type IS NOT NULL) as top_effective,
        json_agg(DISTINCT jsonb_build_object(
          'coaching_type', lp.coaching_type,
          'effectiveness_rate', lp.effectiveness_rate,
          'dismissal_rate', lp.dismissal_rate,
          'sample_size', lp.total
        )) FILTER (WHERE lp.coaching_type IS NOT NULL) as low_performers
      FROM totals t
      LEFT JOIN top_effective te ON true
      LEFT JOIN low_performers lp ON true
      GROUP BY t.total_shown, t.acted_upon, t.thumbs_up, t.dismissed, t.thumbs_down, t.improved, t.not_improved
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    const totalShown = parseInt(row.total_shown) || 0;
    const actedUpon = parseInt(row.acted_upon) || 0;
    const thumbsUp = parseInt(row.thumbs_up) || 0;
    const dismissed = parseInt(row.dismissed) || 0;
    const improved = parseInt(row.improved) || 0;
    const notImproved = parseInt(row.not_improved) || 0;

    return {
      totalTipsShown: totalShown,
      totalActedUpon: actedUpon + thumbsUp,
      totalDismissed: dismissed,
      totalImproved: improved,
      overallEffectivenessRate: totalShown > 0 ? (actedUpon + thumbsUp) / totalShown : 0,
      overallDismissalRate: totalShown > 0 ? dismissed / totalShown : 0,
      overallImprovementRate: (improved + notImproved) > 0 ? improved / (improved + notImproved) : 0,
      topEffective: (row.top_effective || []).map((t: any) => ({
        coachingType: t.coaching_type,
        effectivenessRate: t.effectiveness_rate,
        sampleSize: t.sample_size,
      })),
      lowPerformers: (row.low_performers || []).map((l: any) => ({
        coachingType: l.coaching_type,
        effectivenessRate: l.effectiveness_rate,
        dismissalRate: l.dismissal_rate,
        sampleSize: l.sample_size,
        recommendation: this.generateRecommendation(l.effectiveness_rate, l.dismissal_rate),
      })),
      byCategory: {}, // TODO: aggregate by category
      dateRange: {
        start: params.startDate || '',
        end: params.endDate || '',
      },
    };
  }

  // ===========================================================================
  // By Type Analytics
  // ===========================================================================

  async getByType(params: QueryParams): Promise<CoachingTypeAnalytics[]> {
    const { conditions, queryParams } = this.buildConditions(params);

    const query = `
      WITH filtered AS (
        SELECT
          coaching_type,
          expertise_stage,
          domain,
          behavior_profile,
          action_taken,
          next_prompt_improved,
          created_at
        FROM coaching_outcomes
        WHERE ${conditions.join(' AND ')}
      ),
      by_type AS (
        SELECT
          coaching_type,
          COUNT(*) as total_shown,
          COUNT(*) FILTER (WHERE action_taken = 'injected_prompt') as acted_upon,
          COUNT(*) FILTER (WHERE action_taken = 'thumbs_up') as thumbs_up,
          COUNT(*) FILTER (WHERE action_taken IN ('dismissed', 'clicked_away')) as dismissed,
          COUNT(*) FILTER (WHERE action_taken = 'thumbs_down') as thumbs_down,
          COUNT(*) FILTER (WHERE next_prompt_improved = true) as improved,
          COUNT(*) FILTER (WHERE next_prompt_improved = false) as not_improved
        FROM filtered
        GROUP BY coaching_type
      ),
      trend_data AS (
        SELECT
          coaching_type,
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE action_taken = 'injected_prompt' OR action_taken = 'thumbs_up') as positive,
          COUNT(*) FILTER (WHERE action_taken IN ('dismissed', 'clicked_away')) as dismissed
        FROM filtered
        GROUP BY coaching_type, DATE_TRUNC('day', created_at)
        ORDER BY date
      )
      SELECT
        bt.*,
        json_agg(jsonb_build_object(
          'date', td.date,
          'total', td.total,
          'positive', td.positive,
          'dismissed', td.dismissed
        ) ORDER BY td.date) FILTER (WHERE td.date IS NOT NULL) as trend_data
      FROM by_type bt
      LEFT JOIN trend_data td ON bt.coaching_type = td.coaching_type
      GROUP BY bt.coaching_type, bt.total_shown, bt.acted_upon, bt.thumbs_up,
               bt.dismissed, bt.thumbs_down, bt.improved, bt.not_improved
    `;

    const result = await db.query(query, queryParams);

    return result.rows.map(row => {
      const totalShown = parseInt(row.total_shown) || 0;
      const actedUpon = parseInt(row.acted_upon) || 0;
      const thumbsUp = parseInt(row.thumbs_up) || 0;
      const dismissed = parseInt(row.dismissed) || 0;
      const thumbsDown = parseInt(row.thumbs_down) || 0;
      const improved = parseInt(row.improved) || 0;
      const notImproved = parseInt(row.not_improved) || 0;

      const effectivenessRate = totalShown > 0 ? (actedUpon + thumbsUp) / totalShown : 0;
      const dismissalRate = totalShown > 0 ? dismissed / totalShown : 0;
      const improvementRate = (improved + notImproved) > 0 ? improved / (improved + notImproved) : 0;

      return {
        coachingType: row.coaching_type as AdvancedCoachingType,
        displayName: this.getDisplayName(row.coaching_type),
        description: this.getDescription(row.coaching_type),
        category: this.getCategory(row.coaching_type),
        overall: {
          coachingType: row.coaching_type,
          totalShown,
          actedUpon,
          thumbsUp,
          dismissed,
          thumbsDown,
          improved,
          notImproved,
          effectivenessRate,
          dismissalRate,
          improvementRate,
          confidenceLevel: this.getConfidenceLevel(totalShown),
        },
        byExpertise: {} as any, // Populated in a separate query if needed
        byDomain: {} as any,
        byBehavior: {} as any,
        trend: this.calculateTrend(row.trend_data || []),
        trendData: (row.trend_data || []).map((t: any) => ({
          date: t.date,
          effectivenessRate: t.total > 0 ? t.positive / t.total : 0,
          dismissalRate: t.total > 0 ? t.dismissed / t.total : 0,
          totalShown: t.total,
        })),
        enabled: true,
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  // ===========================================================================
  // Effectiveness Matrix
  // ===========================================================================

  async getEffectivenessMatrix(params: QueryParams): Promise<EffectivenessMatrix> {
    const { conditions, queryParams } = this.buildConditions(params);

    const query = `
      SELECT
        coaching_type,
        expertise_stage,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE action_taken = 'injected_prompt' OR action_taken = 'thumbs_up') as positive
      FROM coaching_outcomes
      WHERE ${conditions.join(' AND ')}
        AND expertise_stage IS NOT NULL
      GROUP BY coaching_type, expertise_stage
    `;

    const result = await db.query(query, queryParams);

    const coachingTypes = [...new Set(result.rows.map(r => r.coaching_type))] as AdvancedCoachingType[];
    const expertiseStages: DreyfusStage[] = ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert'];

    const cells: EffectivenessMatrixCell[] = result.rows.map(row => ({
      coachingType: row.coaching_type,
      segment: row.expertise_stage,
      segmentType: 'expertise' as const,
      effectivenessRate: row.total > 0 ? row.positive / row.total : 0,
      sampleSize: parseInt(row.total),
      confidenceLevel: this.getConfidenceLevel(parseInt(row.total)),
    }));

    return {
      rows: coachingTypes,
      columns: expertiseStages,
      columnType: 'expertise',
      cells,
    };
  }

  // ===========================================================================
  // Recommendations
  // ===========================================================================

  async getRecommendations(params: QueryParams): Promise<CoachingRecommendation[]> {
    const byType = await this.getByType(params);
    const recommendations: CoachingRecommendation[] = [];

    for (const typeData of byType) {
      const { overall, trend } = typeData;

      // High dismissal rate
      if (overall.dismissalRate > 0.7 && overall.totalShown >= 10) {
        recommendations.push({
          coachingType: typeData.coachingType,
          action: overall.dismissalRate > 0.85 ? 'disable' : 'decrease_frequency',
          priority: overall.dismissalRate > 0.85 ? 'high' : 'medium',
          reason: `High dismissal rate (${(overall.dismissalRate * 100).toFixed(0)}%)`,
          supportingData: {
            currentEffectiveness: overall.effectivenessRate,
            currentDismissal: overall.dismissalRate,
            sampleSize: overall.totalShown,
            trend,
          },
        });
      }

      // Low effectiveness
      if (overall.effectivenessRate < 0.15 && overall.totalShown >= 10) {
        recommendations.push({
          coachingType: typeData.coachingType,
          action: 'restrict_to_expertise',
          priority: 'medium',
          reason: `Low effectiveness (${(overall.effectivenessRate * 100).toFixed(0)}%)`,
          supportingData: {
            currentEffectiveness: overall.effectivenessRate,
            currentDismissal: overall.dismissalRate,
            sampleSize: overall.totalShown,
            trend,
          },
        });
      }

      // High effectiveness - increase frequency
      if (overall.effectivenessRate > 0.6 && overall.totalShown >= 10) {
        recommendations.push({
          coachingType: typeData.coachingType,
          action: 'increase_frequency',
          priority: 'low',
          reason: `High effectiveness (${(overall.effectivenessRate * 100).toFixed(0)}%)`,
          supportingData: {
            currentEffectiveness: overall.effectivenessRate,
            currentDismissal: overall.dismissalRate,
            sampleSize: overall.totalShown,
            trend,
          },
        });
      }

      // Declining trend
      if (trend === 'declining' && overall.totalShown >= 20) {
        recommendations.push({
          coachingType: typeData.coachingType,
          action: 'monitor',
          priority: 'medium',
          reason: 'Declining effectiveness trend',
          supportingData: {
            currentEffectiveness: overall.effectivenessRate,
            currentDismissal: overall.dismissalRate,
            sampleSize: overall.totalShown,
            trend,
          },
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private buildConditions(params: QueryParams): { conditions: string[]; queryParams: any[] } {
    const conditions: string[] = ['1=1'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.organizationId) {
      conditions.push(`organization_id = $${paramIndex++}`);
      queryParams.push(params.organizationId);
    }

    if (params.teamId) {
      conditions.push(`team_id = $${paramIndex++}`);
      queryParams.push(params.teamId);
    }

    if (params.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      queryParams.push(params.userId);
    }

    if (params.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      queryParams.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      queryParams.push(params.endDate);
    }

    if (params.coachingTypes && params.coachingTypes.length > 0) {
      conditions.push(`coaching_type = ANY($${paramIndex++})`);
      queryParams.push(params.coachingTypes);
    }

    return { conditions, queryParams };
  }

  private determineScope(params: QueryParams) {
    if (params.userId) {
      return { level: 'user' as const, id: params.userId };
    }
    if (params.teamId) {
      return { level: 'team' as const, id: params.teamId };
    }
    if (params.organizationId) {
      return { level: 'organization' as const, id: params.organizationId };
    }
    return { level: 'global' as const };
  }

  private getConfidenceLevel(sampleSize: number): ConfidenceLevel {
    if (sampleSize >= 50) return 'high';
    if (sampleSize >= 15) return 'medium';
    return 'low';
  }

  private calculateTrend(trendData: any[]): TrendDirection {
    if (trendData.length < 7) return 'stable';

    const recentDays = trendData.slice(-7);
    const olderDays = trendData.slice(-14, -7);

    if (olderDays.length === 0) return 'stable';

    const recentRate = recentDays.reduce((sum, d) => sum + (d.total > 0 ? d.positive / d.total : 0), 0) / recentDays.length;
    const olderRate = olderDays.reduce((sum, d) => sum + (d.total > 0 ? d.positive / d.total : 0), 0) / olderDays.length;

    const change = recentRate - olderRate;
    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  private generateRecommendation(effectiveness: number, dismissal: number): string {
    if (dismissal > 0.8) return 'Consider disabling or restricting audience';
    if (effectiveness < 0.1) return 'Restrict to specific expertise levels';
    if (effectiveness < 0.2) return 'Review trigger conditions';
    return 'Monitor for improvement';
  }

  private getDisplayName(type: string): string {
    const displayMap: Record<string, string> = {
      hallucination_risk: 'Hallucination Risk',
      refusal_recovery: 'Refusal Recovery',
      stop_ramble: 'Stop Ramble',
      math_date_check: 'Math/Date Check',
      contradictory_instructions: 'Contradictory Instructions',
      action_extraction: 'Action Extraction',
      red_team_check: 'Red Team Check',
      fact_check_mode: 'Fact Check Mode',
      anti_generic: 'Anti-Generic',
      stepwise_mode: 'Stepwise Mode',
      off_piste_drift: 'Topic Drift',
      off_piste_constraint: 'Constraint Violation',
      off_piste_invented: 'Invented Context',
      off_piste_looping: 'Looping Detection',
      sycophancy_detection: 'Sycophancy Detection',
    };
    return displayMap[type] || type;
  }

  private getDescription(type: string): string {
    const descMap: Record<string, string> = {
      hallucination_risk: 'Warns about unsourced factual claims',
      refusal_recovery: 'Helps recover from AI refusals',
      stop_ramble: 'Suggests summarizing long responses',
      math_date_check: 'Prompts verification of calculations',
      contradictory_instructions: 'Detects conflicting requirements',
      action_extraction: 'Converts advice to actionable steps',
      red_team_check: 'Suggests considering failure modes',
      fact_check_mode: 'Prompts verification before sharing',
      anti_generic: 'Pushes for specific answers',
      stepwise_mode: 'Suggests breaking into steps',
      off_piste_drift: 'Detects response wandering',
      off_piste_constraint: 'Catches ignored constraints',
      off_piste_invented: 'Flags assumed information',
      off_piste_looping: 'Detects repetitive responses',
      sycophancy_detection: 'Warns about excessive agreement',
    };
    return descMap[type] || '';
  }

  private getCategory(type: string): 'safety' | 'quality' | 'efficiency' | 'behavior' {
    const catMap: Record<string, 'safety' | 'quality' | 'efficiency' | 'behavior'> = {
      hallucination_risk: 'safety',
      refusal_recovery: 'efficiency',
      stop_ramble: 'efficiency',
      math_date_check: 'safety',
      contradictory_instructions: 'quality',
      action_extraction: 'efficiency',
      red_team_check: 'quality',
      fact_check_mode: 'safety',
      anti_generic: 'quality',
      stepwise_mode: 'efficiency',
      off_piste_drift: 'behavior',
      off_piste_constraint: 'behavior',
      off_piste_invented: 'behavior',
      off_piste_looping: 'behavior',
      sycophancy_detection: 'quality',
    };
    return catMap[type] || 'quality';
  }
}

export const coachingAnalyticsService = new CoachingAnalyticsService();
