import db from '../db/connection.js';
import type {
  VerificationBehaviorAnalysis,
  EditRatioAnalysis,
  DialogueDepthAnalysis,
  TimeToActionAnalysis,
  CriticalEngagementAnalysis,
  FeedbackQualityAnalysis,
  DeepBehaviorSummary,
} from '@corrix/shared';

interface QueryParams {
  organizationId: string;
  teamId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export class DeepBehaviorAnalyticsService {

  /**
   * Verification behavior analysis
   * Capability #12
   */
  async getVerificationAnalysis(params: QueryParams): Promise<VerificationBehaviorAnalysis> {
    const { organizationId, teamId, userId, startDate, endDate } = params;

    const conditions = this.buildConditions(params);
    const queryParams = this.buildParams(params);

    const query = `
      WITH filtered AS (
        SELECT bs.*
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
      ),
      overall AS (
        SELECT
          COUNT(*) FILTER (WHERE has_verification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as verification_rate,
          COUNT(*) as total
        FROM filtered
      ),
      user_rates AS (
        SELECT
          user_id,
          COUNT(*) FILTER (WHERE has_verification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as rate
        FROM filtered
        GROUP BY user_id
      ),
      population AS (
        SELECT
          AVG(rate) as mean,
          50.0 as percentile
        FROM user_rates
      )
      SELECT
        COALESCE(o.verification_rate, 0) as verification_rate,
        COALESCE(p.mean, 0) as population_mean,
        COALESCE(p.percentile, 50) as percentile
      FROM overall o, population p
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    // Get platform breakdown
    const platformQuery = `
      SELECT
        platform,
        COUNT(*) FILTER (WHERE has_verification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as rate
      FROM behavioral_signals bs
      JOIN users u ON bs.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY platform
    `;
    const platformResult = await db.query(platformQuery, queryParams);

    const platforms: VerificationBehaviorAnalysis['verificationByPlatform'] = {
      claude: 0,
      chatgpt: 0,
      gemini: 0,
    };
    for (const prow of platformResult.rows) {
      if (prow.platform in platforms) {
        platforms[prow.platform as keyof typeof platforms] = parseFloat(prow.rate || 0);
      }
    }

    return {
      verificationRate: parseFloat(row.verification_rate || 0),
      byType: {
        sourceRequests: 0, // Would require NLP analysis
        accuracyChecks: 0,
        clarificationRequests: 0,
        crossReferencing: 0,
      },
      verificationByComplexity: {
        simple: 0,
        moderate: 0,
        complex: 0,
      },
      verificationByPlatform: platforms,
      trend: {
        current: parseFloat(row.verification_rate || 0),
        previous: 0,
        change: 0,
        direction: 'stable',
      },
      vsPopulation: {
        mean: parseFloat(row.population_mean || 0),
        percentile: parseFloat(row.percentile || 50),
      },
    };
  }

  /**
   * Edit ratio analysis
   * Capability #13
   */
  async getEditRatioAnalysis(params: QueryParams): Promise<EditRatioAnalysis> {
    const conditions = this.buildConditions(params);
    const queryParams = this.buildParams(params);

    const query = `
      WITH filtered AS (
        SELECT bs.*
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
          AND action_type IS NOT NULL
      ),
      actions AS (
        SELECT
          COUNT(*) FILTER (WHERE action_type = 'accept') * 100.0 / NULLIF(COUNT(*), 0) as used_as_is,
          COUNT(*) FILTER (WHERE action_type = 'edit') * 100.0 / NULLIF(COUNT(*), 0) as edited,
          COUNT(*) FILTER (WHERE action_type = 'copy') * 100.0 / NULLIF(COUNT(*), 0) as copied,
          COUNT(*) FILTER (WHERE action_type = 'regenerate') * 100.0 / NULLIF(COUNT(*), 0) as regenerated,
          COUNT(*) FILTER (WHERE action_type = 'abandon') * 100.0 / NULLIF(COUNT(*), 0) as discarded,
          AVG(edit_ratio) * 100 as overall_edit_ratio
        FROM filtered
      ),
      trend AS (
        SELECT
          timestamp::date as date,
          AVG(edit_ratio) * 100 as edit_ratio
        FROM filtered
        WHERE edit_ratio IS NOT NULL
        GROUP BY timestamp::date
        ORDER BY date
      )
      SELECT * FROM actions
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    // Get trend
    const trendQuery = `
      SELECT
        timestamp::date as date,
        AVG(edit_ratio) * 100 as edit_ratio
      FROM behavioral_signals bs
      JOIN users u ON bs.user_id = u.id
      WHERE ${conditions.join(' AND ')}
        AND edit_ratio IS NOT NULL
      GROUP BY timestamp::date
      ORDER BY date
    `;
    const trendResult = await db.query(trendQuery, queryParams);

    const overallEditRatio = parseFloat(row.overall_edit_ratio || 0);
    const insight = overallEditRatio < 10 ? 'over_accepting' :
                   overallEditRatio > 50 ? 'over_editing' : 'optimal';

    return {
      overallEditRatio,
      usedAsIs: parseFloat(row.used_as_is || 0),
      minorEdits: parseFloat(row.edited || 0) * 0.6,
      majorEdits: parseFloat(row.edited || 0) * 0.4,
      discarded: parseFloat(row.discarded || 0),
      editPatterns: {
        copyAndEdit: parseFloat(row.copied || 0),
        inlineEdit: parseFloat(row.edited || 0),
        regenerated: parseFloat(row.regenerated || 0),
      },
      trend: trendResult.rows.map(r => ({
        date: r.date.toISOString().split('T')[0],
        editRatio: parseFloat(r.edit_ratio || 0),
      })),
      insight,
      insightExplanation: insight === 'over_accepting'
        ? 'Low edit ratio suggests outputs are being accepted without sufficient review'
        : insight === 'over_editing'
        ? 'High edit ratio may indicate prompt quality issues or over-correction'
        : 'Edit ratio is within optimal range',
    };
  }

  /**
   * Dialogue depth analysis
   * Capability #14
   */
  async getDialogueDepthAnalysis(params: QueryParams): Promise<DialogueDepthAnalysis> {
    const conditions = this.buildConditions(params);
    const queryParams = this.buildParams(params);

    const query = `
      WITH filtered AS (
        SELECT DISTINCT ON (session_id)
          session_id,
          conversation_depth,
          outcome_rating
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
          AND conversation_depth IS NOT NULL
        ORDER BY session_id, timestamp DESC
      ),
      distribution AS (
        SELECT
          COUNT(*) FILTER (WHERE conversation_depth = 1) * 100.0 / NULLIF(COUNT(*), 0) as single_turn,
          COUNT(*) FILTER (WHERE conversation_depth BETWEEN 2 AND 3) * 100.0 / NULLIF(COUNT(*), 0) as short,
          COUNT(*) FILTER (WHERE conversation_depth BETWEEN 4 AND 7) * 100.0 / NULLIF(COUNT(*), 0) as medium,
          COUNT(*) FILTER (WHERE conversation_depth BETWEEN 8 AND 15) * 100.0 / NULLIF(COUNT(*), 0) as deep,
          COUNT(*) FILTER (WHERE conversation_depth > 15) * 100.0 / NULLIF(COUNT(*), 0) as very_deep,
          AVG(conversation_depth) as avg_depth,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY conversation_depth) as median_depth,
          AVG(conversation_depth) FILTER (WHERE outcome_rating >= 4) as successful_depth,
          AVG(conversation_depth) FILTER (WHERE outcome_rating <= 2) as unsuccessful_depth,
          COUNT(*) FILTER (WHERE conversation_depth BETWEEN 3 AND 7) * 100.0 / NULLIF(COUNT(*), 0) as in_optimal
        FROM filtered
      )
      SELECT * FROM distribution
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    return {
      distribution: {
        singleTurn: parseFloat(row.single_turn || 0),
        short: parseFloat(row.short || 0),
        medium: parseFloat(row.medium || 0),
        deep: parseFloat(row.deep || 0),
        veryDeep: parseFloat(row.very_deep || 0),
      },
      averageDepth: parseFloat(row.avg_depth || 0),
      medianDepth: parseFloat(row.median_depth || 0),
      depthByOutcome: {
        successful: parseFloat(row.successful_depth || 0),
        unsuccessful: parseFloat(row.unsuccessful_depth || 0),
      },
      optimalRange: { min: 3, max: 7 },
      inOptimalRange: parseFloat(row.in_optimal || 0),
      patterns: {
        averageRefinementCycles: parseFloat(row.avg_depth || 0) - 1,
        iterationVelocity: 0,
      },
    };
  }

  /**
   * Time-to-action analysis
   * Capability #15
   */
  async getTimeToActionAnalysis(params: QueryParams): Promise<TimeToActionAnalysis> {
    const conditions = this.buildConditions(params);
    const queryParams = this.buildParams(params);

    const query = `
      WITH filtered AS (
        SELECT bs.*
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
          AND time_to_action_seconds IS NOT NULL
      ),
      stats AS (
        SELECT
          AVG(time_to_action_seconds) as avg_time,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_to_action_seconds) as median_time,
          COUNT(*) FILTER (WHERE time_to_action_seconds < 5) * 100.0 / NULLIF(COUNT(*), 0) as immediate,
          COUNT(*) FILTER (WHERE time_to_action_seconds BETWEEN 5 AND 15) * 100.0 / NULLIF(COUNT(*), 0) as quick,
          COUNT(*) FILTER (WHERE time_to_action_seconds BETWEEN 15 AND 60) * 100.0 / NULLIF(COUNT(*), 0) as considered,
          COUNT(*) FILTER (WHERE time_to_action_seconds BETWEEN 60 AND 300) * 100.0 / NULLIF(COUNT(*), 0) as deliberate,
          COUNT(*) FILTER (WHERE time_to_action_seconds > 300) * 100.0 / NULLIF(COUNT(*), 0) as extended,
          AVG(time_to_action_seconds) FILTER (WHERE action_type = 'accept') as accept_time,
          AVG(time_to_action_seconds) FILTER (WHERE action_type = 'copy') as copy_time,
          AVG(time_to_action_seconds) FILTER (WHERE action_type = 'edit') as edit_time,
          AVG(time_to_action_seconds) FILTER (WHERE action_type = 'regenerate') as regenerate_time,
          COUNT(*) FILTER (WHERE time_to_action_seconds BETWEEN 10 AND 60) * 100.0 / NULLIF(COUNT(*), 0) as in_optimal,
          CORR(time_to_action_seconds, outcome_rating) as correlation
        FROM filtered
      )
      SELECT * FROM stats
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    const avgTime = parseFloat(row.avg_time || 0);
    const insight = avgTime < 5 ? 'impulsive' :
                   avgTime > 120 ? 'over_deliberating' : 'optimal';

    return {
      averageTimeToAction: avgTime,
      medianTimeToAction: parseFloat(row.median_time || 0),
      distribution: {
        immediate: parseFloat(row.immediate || 0),
        quick: parseFloat(row.quick || 0),
        considered: parseFloat(row.considered || 0),
        deliberate: parseFloat(row.deliberate || 0),
        extended: parseFloat(row.extended || 0),
      },
      byActionType: {
        accept: parseFloat(row.accept_time || 0),
        copy: parseFloat(row.copy_time || 0),
        edit: parseFloat(row.edit_time || 0),
        regenerate: parseFloat(row.regenerate_time || 0),
      },
      patterns: {
        correlationWithQuality: parseFloat(row.correlation || 0),
        optimalRange: { min: 10, max: 60 },
        inOptimalRange: parseFloat(row.in_optimal || 0),
      },
      insight,
      recommendations: insight === 'impulsive'
        ? ['Take more time to review AI outputs before acting', 'Consider the quality before accepting']
        : insight === 'over_deliberating'
        ? ['Trust your initial judgment more', 'Set time limits for decision-making']
        : ['Maintain current deliberation patterns'],
    };
  }

  /**
   * Critical engagement analysis
   * Capability #17
   */
  async getCriticalEngagementAnalysis(params: QueryParams): Promise<CriticalEngagementAnalysis> {
    const conditions = this.buildConditions(params);
    const queryParams = this.buildParams(params);

    const query = `
      WITH filtered AS (
        SELECT bs.*
        FROM behavioral_signals bs
        JOIN users u ON bs.user_id = u.id
        WHERE ${conditions.join(' AND ')}
      ),
      engagement AS (
        SELECT
          COUNT(*) FILTER (WHERE has_pushback = true OR has_clarification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as overall_rate,
          COUNT(*) FILTER (WHERE has_pushback = true) * 100.0 / NULLIF(COUNT(*), 0) as pushback_rate,
          COUNT(*) FILTER (WHERE has_clarification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as clarification_rate,
          CORR(
            CASE WHEN has_pushback = true OR has_clarification_request = true THEN 1 ELSE 0 END,
            outcome_rating
          ) as correlation
        FROM filtered
      ),
      user_distribution AS (
        SELECT
          user_id,
          COUNT(*) FILTER (WHERE has_pushback = true OR has_clarification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as rate
        FROM filtered
        GROUP BY user_id
      ),
      distribution AS (
        SELECT
          COUNT(*) FILTER (WHERE rate = 0) * 100.0 / NULLIF(COUNT(*), 0) as none,
          COUNT(*) FILTER (WHERE rate > 0 AND rate <= 10) * 100.0 / NULLIF(COUNT(*), 0) as low,
          COUNT(*) FILTER (WHERE rate > 10 AND rate <= 30) * 100.0 / NULLIF(COUNT(*), 0) as moderate,
          COUNT(*) FILTER (WHERE rate > 30) * 100.0 / NULLIF(COUNT(*), 0) as high
        FROM user_distribution
      ),
      trend AS (
        SELECT
          timestamp::date as date,
          COUNT(*) FILTER (WHERE has_pushback = true OR has_clarification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as rate
        FROM filtered
        GROUP BY timestamp::date
        ORDER BY date
      )
      SELECT e.*, d.*
      FROM engagement e, distribution d
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    // Get trend data
    const trendQuery = `
      SELECT
        timestamp::date as date,
        COUNT(*) FILTER (WHERE has_pushback = true OR has_clarification_request = true) * 100.0 / NULLIF(COUNT(*), 0) as rate
      FROM behavioral_signals bs
      JOIN users u ON bs.user_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY timestamp::date
      ORDER BY date
    `;
    const trendResult = await db.query(trendQuery, queryParams);

    return {
      criticalEngagementRate: parseFloat(row.overall_rate || 0),
      byType: {
        pushback: parseFloat(row.pushback_rate || 0),
        disagreement: 0,
        alternativeRequest: 0,
        limitationCheck: 0,
        reasoningRequest: parseFloat(row.clarification_rate || 0),
      },
      trend: trendResult.rows.map(r => ({
        date: r.date.toISOString().split('T')[0],
        rate: parseFloat(r.rate || 0),
      })),
      correlationWithOutcomes: parseFloat(row.correlation || 0),
      engagementDistribution: {
        none: parseFloat(row.none || 0),
        low: parseFloat(row.low || 0),
        moderate: parseFloat(row.moderate || 0),
        high: parseFloat(row.high || 0),
      },
    };
  }

  /**
   * Feedback quality analysis
   * Capability #20
   */
  async getFeedbackQualityAnalysis(params: QueryParams): Promise<FeedbackQualityAnalysis> {
    const conditions = this.buildConditions(params);
    const queryParams = this.buildParams(params);

    const query = `
      WITH filtered AS (
        SELECT fqs.*
        FROM feedback_quality_scores fqs
        JOIN users u ON fqs.user_id = u.id
        WHERE ${conditions.join(' AND ').replace(/bs\./g, 'fqs.').replace(/timestamp/g, 'fqs.timestamp')}
      ),
      stats AS (
        SELECT
          AVG(overall_quality) as overall,
          AVG(specificity_score) as specificity,
          AVG(explanation_score) as explanation,
          AVG(constructiveness_score) as constructiveness,
          AVG(actionability_score) as actionability,
          COUNT(*) FILTER (WHERE has_specific_reference = true) * 100.0 / NULLIF(COUNT(*), 0) as has_reference,
          COUNT(*) FILTER (WHERE has_reasoning = true) * 100.0 / NULLIF(COUNT(*), 0) as has_reasoning,
          COUNT(*) FILTER (WHERE has_alternative_suggestion = true) * 100.0 / NULLIF(COUNT(*), 0) as has_alternative,
          COUNT(*) FILTER (WHERE has_clear_direction = true) * 100.0 / NULLIF(COUNT(*), 0) as has_direction,
          AVG(overall_quality) FILTER (WHERE message_index <= 3) as early_quality,
          AVG(overall_quality) FILTER (WHERE message_index BETWEEN 4 AND 7) as mid_quality,
          AVG(overall_quality) FILTER (WHERE message_index > 7) as late_quality
        FROM filtered
      ),
      trend AS (
        SELECT
          timestamp::date as date,
          AVG(overall_quality) as quality
        FROM filtered
        GROUP BY timestamp::date
        ORDER BY date
      )
      SELECT * FROM stats
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    // Get trend data
    const trendQuery = `
      SELECT
        timestamp::date as date,
        AVG(overall_quality) as quality
      FROM feedback_quality_scores fqs
      JOIN users u ON fqs.user_id = u.id
      WHERE ${conditions.join(' AND ').replace(/bs\./g, 'fqs.').replace(/timestamp/g, 'fqs.timestamp')}
      GROUP BY timestamp::date
      ORDER BY date
    `;
    const trendResult = await db.query(trendQuery, queryParams);

    // Determine improvement areas
    const components = {
      specificity: parseFloat(row.specificity || 0),
      explanation: parseFloat(row.explanation || 0),
      constructiveness: parseFloat(row.constructiveness || 0),
      actionability: parseFloat(row.actionability || 0),
    };
    const sorted = Object.entries(components).sort((a, b) => a[1] - b[1]);
    const improvementAreas = sorted.slice(0, 2).map(([key]) => {
      const messages: Record<string, string> = {
        specificity: 'Reference specific parts of AI output in feedback',
        explanation: 'Explain why changes are needed',
        constructiveness: 'Suggest alternatives when providing criticism',
        actionability: 'Make feedback actionable for the AI',
      };
      return messages[key];
    });

    return {
      overallQuality: parseFloat(row.overall || 0),
      components,
      patterns: {
        hasSpecificReference: parseFloat(row.has_reference || 0),
        hasReasoning: parseFloat(row.has_reasoning || 0),
        hasAlternative: parseFloat(row.has_alternative || 0),
        hasClearDirection: parseFloat(row.has_direction || 0),
      },
      qualityByDepth: {
        early: parseFloat(row.early_quality || 0),
        mid: parseFloat(row.mid_quality || 0),
        late: parseFloat(row.late_quality || 0),
      },
      trend: trendResult.rows.map(r => ({
        date: r.date.toISOString().split('T')[0],
        quality: parseFloat(r.quality || 0),
      })),
      improvementAreas,
    };
  }

  /**
   * Get complete deep behavior summary
   */
  async getDeepBehaviorSummary(params: QueryParams): Promise<DeepBehaviorSummary> {
    const [
      verification,
      editRatio,
      dialogueDepth,
      timeToAction,
      criticalEngagement,
      feedbackQuality,
    ] = await Promise.all([
      this.getVerificationAnalysis(params),
      this.getEditRatioAnalysis(params),
      this.getDialogueDepthAnalysis(params),
      this.getTimeToActionAnalysis(params),
      this.getCriticalEngagementAnalysis(params),
      this.getFeedbackQualityAnalysis(params),
    ]);

    return {
      userId: params.userId,
      teamId: params.teamId,
      organizationId: params.organizationId,
      periodStart: params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: params.endDate || new Date().toISOString().split('T')[0],
      verification,
      editRatio,
      dialogueDepth,
      timeToAction,
      criticalEngagement,
      feedbackQuality,
    };
  }

  private buildConditions(params: QueryParams): string[] {
    const conditions: string[] = ['u.organization_id = $1'];
    let paramIndex = 2;

    if (params.teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
    }
    if (params.userId) {
      conditions.push(`bs.user_id = $${paramIndex++}`);
    }
    if (params.startDate) {
      conditions.push(`bs.timestamp >= $${paramIndex++}`);
    }
    if (params.endDate) {
      conditions.push(`bs.timestamp <= $${paramIndex++}`);
    }

    return conditions;
  }

  private buildParams(params: QueryParams): (string | undefined)[] {
    const queryParams: (string | undefined)[] = [params.organizationId];
    if (params.teamId) queryParams.push(params.teamId);
    if (params.userId) queryParams.push(params.userId);
    if (params.startDate) queryParams.push(params.startDate);
    if (params.endDate) queryParams.push(params.endDate);
    return queryParams.filter(p => p !== undefined);
  }
}
