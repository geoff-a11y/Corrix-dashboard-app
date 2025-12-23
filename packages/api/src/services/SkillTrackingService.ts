import db from '../db/connection.js';
import type {
  SkillTrajectory,
  LearningVelocity,
  SkillGapAnalysis,
  TimeToCompetencyMetrics,
  CompetencyEvent,
  SkillGap,
  VelocityPeriod,
  BenchmarkScope,
} from '@corrix/shared';

export class SkillTrackingService {

  /**
   * Get skill trajectory for a user
   * Capability #21
   */
  async getSkillTrajectory(params: {
    userId: string;
    days: number;
  }): Promise<SkillTrajectory> {
    const { userId, days } = params;

    // Get skill snapshots
    const snapshotsQuery = `
      SELECT
        date,
        overall_skill_score,
        skill_prompt_engineering,
        skill_output_evaluation,
        skill_verification,
        skill_iteration,
        skill_adaptation,
        skill_critical_thinking,
        trajectory_score,
        trajectory_direction
      FROM skill_snapshots
      WHERE user_id = $1
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date ASC
    `;

    const snapshots = await db.query(snapshotsQuery, [userId]);

    // Get milestones
    const milestonesQuery = `
      SELECT
        event_type,
        milestone_name,
        milestone_value,
        previous_value,
        occurred_at,
        days_since_first_use
      FROM competency_events
      WHERE user_id = $1
      ORDER BY occurred_at ASC
    `;

    const milestones = await db.query(milestonesQuery, [userId]);

    // Calculate trajectory metrics
    const points = snapshots.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      overallScore: parseFloat(row.overall_skill_score || 0),
      components: {
        promptEngineering: parseFloat(row.skill_prompt_engineering || 0),
        outputEvaluation: parseFloat(row.skill_output_evaluation || 0),
        verification: parseFloat(row.skill_verification || 0),
        iteration: parseFloat(row.skill_iteration || 0),
        adaptation: parseFloat(row.skill_adaptation || 0),
        criticalThinking: parseFloat(row.skill_critical_thinking || 0),
      },
    }));

    const startScore = points[0]?.overallScore || 0;
    const currentScore = points[points.length - 1]?.overallScore || 0;
    const improvement = currentScore - startScore;
    const weeksInPeriod = days / 7;
    const improvementRate = weeksInPeriod > 0 ? improvement / weeksInPeriod : 0;

    // Project future scores based on current trajectory
    const projectedScore30d = Math.min(100, currentScore + (improvementRate * 4.3));
    const projectedScore90d = Math.min(100, currentScore + (improvementRate * 12.9));

    return {
      userId,
      points,
      currentScore,
      startScore,
      improvement,
      improvementRate,
      milestones: milestones.rows.map(row => ({
        eventType: row.event_type,
        milestoneName: row.milestone_name,
        milestoneValue: parseFloat(row.milestone_value || 0),
        previousValue: row.previous_value ? parseFloat(row.previous_value) : undefined,
        occurredAt: row.occurred_at.toISOString(),
        daysSinceFirstUse: row.days_since_first_use,
      })),
      projectedScore30d,
      projectedScore90d,
    };
  }

  /**
   * Get learning velocity leaderboard
   * Capability #22
   */
  async getVelocityLeaderboard(params: {
    organizationId: string;
    teamId?: string;
    roleId?: string;
    limit: number;
    period: VelocityPeriod;
  }): Promise<LearningVelocity[]> {
    const { organizationId, teamId, roleId, limit, period } = params;

    const velocityColumn = `velocity_${period.replace('d', '')}d`;

    const conditions: string[] = ['u.organization_id = $1'];
    const queryParams: (string | number)[] = [organizationId];
    let paramIndex = 2;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      queryParams.push(teamId);
    }
    if (roleId) {
      conditions.push(`um.role_id = $${paramIndex++}`);
      queryParams.push(roleId);
    }

    queryParams.push(limit);

    const query = `
      WITH latest_snapshots AS (
        SELECT user_id, overall_skill_score
        FROM skill_snapshots
        WHERE date = (SELECT MAX(date) FROM skill_snapshots)
      )
      SELECT
        lv.user_id,
        lv.${velocityColumn} as velocity,
        lv.velocity_7d,
        lv.velocity_14d,
        lv.velocity_30d,
        lv.velocity_90d,
        lv.acceleration,
        lv.rank_in_org,
        lv.rank_in_team,
        lv.percentile_in_org,
        COALESCE(ls.overall_skill_score, 0) as current_score,
        t.name as team_name
      FROM learning_velocity lv
      JOIN users u ON lv.user_id = u.id
      LEFT JOIN latest_snapshots ls ON lv.user_id = ls.user_id
      LEFT JOIN teams t ON u.team_id = t.id
      LEFT JOIN user_metadata um ON u.id = um.user_id
      WHERE ${conditions.join(' AND ')}
        AND lv.calculated_at = (SELECT MAX(calculated_at) FROM learning_velocity WHERE user_id = lv.user_id)
      ORDER BY lv.${velocityColumn} DESC
      LIMIT $${paramIndex}
    `;

    const result = await db.query(query, queryParams);

    return result.rows.map((row, index) => ({
      userId: row.user_id,
      teamName: row.team_name,
      velocity7d: parseFloat(row.velocity_7d || 0),
      velocity14d: parseFloat(row.velocity_14d || 0),
      velocity30d: parseFloat(row.velocity_30d || 0),
      velocity90d: parseFloat(row.velocity_90d || 0),
      acceleration: parseFloat(row.acceleration || 0),
      rankInOrg: row.rank_in_org || index + 1,
      rankInTeam: row.rank_in_team || 0,
      rankInRole: 0,
      percentileInOrg: parseFloat(row.percentile_in_org || 0),
      currentScore: parseFloat(row.current_score),
    }));
  }

  /**
   * Get skill gap analysis
   * Capability #23
   */
  async getSkillGapAnalysis(params: {
    userId: string;
    benchmarkScope?: BenchmarkScope;
    benchmarkScopeId?: string;
  }): Promise<SkillGapAnalysis> {
    const { userId, benchmarkScope = 'organization', benchmarkScopeId } = params;

    // Get user's current skills
    const userSkillsQuery = `
      SELECT
        overall_skill_score,
        skill_prompt_engineering,
        skill_output_evaluation,
        skill_verification,
        skill_iteration,
        skill_adaptation,
        skill_critical_thinking,
        trajectory_score
      FROM skill_snapshots
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 1
    `;

    const userSkills = await db.query(userSkillsQuery, [userId]);
    const currentSkills = userSkills.rows[0] || {};

    // Get benchmark targets
    const benchmarkConditions = ['scope_type = $1', "metric_name LIKE 'skill_%'"];
    const benchmarkParams: (string | undefined)[] = [benchmarkScope];
    let paramIndex = 2;

    if (benchmarkScopeId) {
      benchmarkConditions.push(`scope_id = $${paramIndex++}`);
      benchmarkParams.push(benchmarkScopeId);
    } else {
      benchmarkConditions.push('scope_id IS NULL');
    }

    const benchmarkQuery = `
      SELECT
        metric_name,
        p75 as target
      FROM benchmarks
      WHERE ${benchmarkConditions.join(' AND ')}
        AND period_end = (SELECT MAX(period_end) FROM benchmarks WHERE scope_type = $1)
    `;

    const benchmarks = await db.query(benchmarkQuery, benchmarkParams.filter(p => p !== undefined));

    // Calculate gaps
    const skillMappings = [
      { name: 'skill_prompt_engineering', display: 'Prompt Engineering', column: 'skill_prompt_engineering' },
      { name: 'skill_output_evaluation', display: 'Output Evaluation', column: 'skill_output_evaluation' },
      { name: 'skill_verification', display: 'Verification', column: 'skill_verification' },
      { name: 'skill_iteration', display: 'Iteration', column: 'skill_iteration' },
      { name: 'skill_adaptation', display: 'Adaptation', column: 'skill_adaptation' },
      { name: 'skill_critical_thinking', display: 'Critical Thinking', column: 'skill_critical_thinking' },
    ];

    const gaps: SkillGap[] = skillMappings.map(skill => {
      const currentValue = parseFloat(currentSkills[skill.column] || 0);
      const benchmark = benchmarks.rows.find(b => b.metric_name === skill.name);
      const targetValue = benchmark ? parseFloat(benchmark.target) : 75;
      const gap = targetValue - currentValue;

      return {
        skillName: skill.name,
        displayName: skill.display,
        currentValue,
        targetValue,
        gap,
        gapPercentage: targetValue > 0 ? (gap / targetValue) * 100 : 0,
        priority: gap > 20 ? 'high' : gap > 10 ? 'medium' : 'low',
        estimatedDaysToClose: gap > 0 ? Math.ceil(gap / 0.5) : null,
        recommendations: this.getSkillRecommendations(skill.name, gap),
      };
    });

    // Sort by priority
    const prioritizedGaps = [...gaps].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Calculate overall metrics
    const overallGap = gaps.reduce((sum, g) => sum + Math.max(0, g.gap), 0) / gaps.length;
    const overallProgress = 100 - overallGap;

    // Get days since first use
    const firstUseQuery = `
      SELECT days_since_first_use
      FROM competency_events
      WHERE user_id = $1 AND event_type = 'first_interaction'
      ORDER BY occurred_at ASC
      LIMIT 1
    `;
    const firstUse = await db.query(firstUseQuery, [userId]);
    const daysSinceStart = firstUse.rows[0]?.days_since_first_use || 0;

    return {
      userId,
      analyzedAt: new Date().toISOString(),
      overallGap,
      overallProgress,
      gaps,
      prioritizedGaps,
      estimatedDaysToCompetency: overallGap > 0 ? Math.ceil(overallGap / 0.5) : null,
      actualDaysSinceStart: daysSinceStart,
    };
  }

  /**
   * Get time-to-competency metrics
   * Capability #26
   */
  async getTimeToCompetencyMetrics(params: {
    organizationId: string;
    teamId?: string;
    roleId?: string;
    cohortStart?: string;
    cohortEnd?: string;
  }): Promise<TimeToCompetencyMetrics> {
    const { organizationId, teamId, cohortStart, cohortEnd } = params;

    const conditions: string[] = ['u.organization_id = $1'];
    const populationParams: string[] = [organizationId];
    let paramIndex = 2;

    if (teamId) {
      conditions.push(`u.team_id = $${paramIndex++}`);
      populationParams.push(teamId);
    }

    // Get population stats for time to reach competency (score >= 70)
    const populationQuery = `
      WITH competency_times AS (
        SELECT
          ce.user_id,
          ce.days_since_first_use as days_to_competency
        FROM competency_events ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.event_type = 'reached_competent'
          AND ${conditions.join(' AND ')}
      )
      SELECT
        COALESCE(AVG(days_to_competency), 0) as mean,
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_competency), 0) as median,
        COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY days_to_competency), 0) as p25,
        COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY days_to_competency), 0) as p75,
        COALESCE(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY days_to_competency), 0) as p90,
        COUNT(*) as sample_size
      FROM competency_times
    `;

    const populationResult = await db.query(populationQuery, populationParams);

    // Get milestone breakdown
    const milestonesQuery = `
      SELECT
        ce.event_type as milestone,
        CASE
          WHEN ce.event_type = 'reached_baseline' THEN 50
          WHEN ce.event_type = 'reached_competent' THEN 70
          WHEN ce.event_type = 'reached_proficient' THEN 85
          WHEN ce.event_type = 'reached_expert' THEN 95
        END as threshold,
        AVG(ce.days_since_first_use) as mean_days,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ce.days_since_first_use) as median_days,
        COUNT(*) as achieved_count,
        (SELECT COUNT(DISTINCT u2.id) FROM users u2 WHERE u2.organization_id = $1) as total_users
      FROM competency_events ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.event_type IN ('reached_baseline', 'reached_competent', 'reached_proficient', 'reached_expert')
        AND ${conditions.join(' AND ')}
      GROUP BY ce.event_type
      ORDER BY threshold
    `;

    const milestonesResult = await db.query(milestonesQuery, populationParams);

    // Get cohort analysis if dates provided
    let cohorts: TimeToCompetencyMetrics['cohorts'] = [];
    if (cohortStart && cohortEnd) {
      const cohortQuery = `
        WITH cohort_users AS (
          SELECT u.id, MIN(ce.occurred_at) as first_interaction
          FROM users u
          JOIN competency_events ce ON u.id = ce.user_id
          WHERE u.organization_id = $1
            AND ce.event_type = 'first_interaction'
            AND ce.occurred_at BETWEEN $2 AND $3
          GROUP BY u.id
        ),
        cohort_competency AS (
          SELECT
            cu.id,
            ce.days_since_first_use
          FROM cohort_users cu
          LEFT JOIN competency_events ce ON cu.id = ce.user_id AND ce.event_type = 'reached_competent'
        )
        SELECT
          'Cohort ' || TO_CHAR($2::date, 'Mon YYYY') as cohort_name,
          $2::date as start_date,
          COUNT(*) as user_count,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_since_first_use) FILTER (WHERE days_since_first_use IS NOT NULL) as median_time,
          COUNT(days_since_first_use) * 100.0 / NULLIF(COUNT(*), 0) as competency_rate
        FROM cohort_competency
      `;

      const cohortResult = await db.query(cohortQuery, [organizationId, cohortStart, cohortEnd]);
      cohorts = cohortResult.rows.map(row => ({
        cohortName: row.cohort_name,
        startDate: row.start_date,
        userCount: parseInt(row.user_count),
        medianTimeToCompetency: parseFloat(row.median_time || 0),
        competencyRate: parseFloat(row.competency_rate || 0),
      }));
    }

    const pop = populationResult.rows[0] || {};

    return {
      population: {
        mean: parseFloat(pop.mean || 0),
        median: parseFloat(pop.median || 0),
        p25: parseFloat(pop.p25 || 0),
        p75: parseFloat(pop.p75 || 0),
        p90: parseFloat(pop.p90 || 0),
        sampleSize: parseInt(pop.sample_size || 0),
      },
      milestones: milestonesResult.rows.map(row => ({
        milestone: row.milestone,
        threshold: row.threshold,
        meanDays: parseFloat(row.mean_days || 0),
        medianDays: parseFloat(row.median_days || 0),
        achievedCount: parseInt(row.achieved_count),
        totalUsers: parseInt(row.total_users),
        achievementRate: (parseInt(row.achieved_count) / parseInt(row.total_users || 1)) * 100,
      })),
      cohorts,
    };
  }

  /**
   * Get competency milestones for a user
   */
  async getUserMilestones(userId: string): Promise<CompetencyEvent[]> {
    const query = `
      SELECT
        event_type,
        milestone_name,
        milestone_value,
        previous_value,
        occurred_at,
        days_since_first_use
      FROM competency_events
      WHERE user_id = $1
      ORDER BY occurred_at DESC
    `;

    const result = await db.query(query, [userId]);

    return result.rows.map(row => ({
      eventType: row.event_type,
      milestoneName: row.milestone_name,
      milestoneValue: parseFloat(row.milestone_value || 0),
      previousValue: row.previous_value ? parseFloat(row.previous_value) : undefined,
      occurredAt: row.occurred_at.toISOString(),
      daysSinceFirstUse: row.days_since_first_use,
    }));
  }

  private getSkillRecommendations(skillName: string, gap: number): string[] {
    const recommendations: Record<string, string[]> = {
      skill_prompt_engineering: [
        'Add more context to your prompts',
        'Include specific constraints and requirements',
        'Provide examples of desired output format',
      ],
      skill_output_evaluation: [
        'Take more time to review AI outputs before accepting',
        'Compare AI suggestions against your expertise',
        'Question confident-sounding but unverified claims',
      ],
      skill_verification: [
        'Ask AI to cite sources for factual claims',
        'Cross-reference important information',
        'Request explanations for recommendations',
      ],
      skill_iteration: [
        'Engage in deeper dialogue with AI',
        'Refine outputs through multiple rounds',
        'Build on previous responses rather than starting over',
      ],
      skill_adaptation: [
        'Try different prompting approaches for different tasks',
        'Experiment with AI capabilities beyond your usual use cases',
        'Adjust your approach based on what works',
      ],
      skill_critical_thinking: [
        'Challenge AI suggestions that seem too easy',
        'Consider alternative approaches AI might have missed',
        'Maintain healthy skepticism of AI confidence',
      ],
    };

    if (gap <= 5) return ['Skill is near target — maintain current practices'];
    return recommendations[skillName] || ['Continue practicing this skill'];
  }
}
