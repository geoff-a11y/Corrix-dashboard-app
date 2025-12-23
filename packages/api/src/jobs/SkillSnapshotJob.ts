import db from '../db/connection.js';

/**
 * Daily job to calculate skill snapshots for all active users
 * Run at 2 AM UTC via cron: 0 2 * * *
 */
export async function runSkillSnapshotJob(): Promise<void> {
  console.log('[SkillSnapshotJob] Starting skill snapshot calculation...');
  const startTime = Date.now();

  try {
    // Get all users with activity in last 30 days
    const usersQuery = `
      SELECT DISTINCT u.id, u.organization_id
      FROM users u
      JOIN behavioral_signals bs ON u.id = bs.user_id
      WHERE bs.timestamp >= NOW() - INTERVAL '30 days'
    `;

    const users = await db.query(usersQuery);
    console.log(`[SkillSnapshotJob] Processing ${users.rows.length} active users`);

    let processed = 0;
    let errors = 0;

    for (const user of users.rows) {
      try {
        await calculateUserSkillSnapshot(user.id, user.organization_id);
        processed++;
      } catch (error) {
        console.error(`[SkillSnapshotJob] Error processing user ${user.id}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[SkillSnapshotJob] Completed: ${processed} processed, ${errors} errors, ${duration}ms`);
  } catch (error) {
    console.error('[SkillSnapshotJob] Fatal error:', error);
    throw error;
  }
}

async function calculateUserSkillSnapshot(userId: string, organizationId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Calculate skill components from last 14 days of behavior
  const skillQuery = `
    WITH recent_behavior AS (
      SELECT *
      FROM behavioral_signals
      WHERE user_id = $1
        AND timestamp >= NOW() - INTERVAL '14 days'
    ),
    skill_metrics AS (
      SELECT
        -- Prompt Engineering: based on prompt quality
        COALESCE(AVG(prompt_quality_score), 50) as prompt_engineering,

        -- Output Evaluation: based on time-to-action and edit ratio
        COALESCE(AVG(CASE
          WHEN time_to_action_seconds BETWEEN 10 AND 60 THEN 80
          WHEN time_to_action_seconds > 60 THEN 90
          ELSE 50
        END), 50) as output_evaluation,

        -- Verification: based on verification requests
        COALESCE(COUNT(*) FILTER (WHERE has_verification_request = true)::float / NULLIF(COUNT(*), 0) * 100, 0) as verification,

        -- Iteration: based on dialogue depth
        COALESCE(LEAST(100, AVG(conversation_depth) * 15), 30) as iteration,

        -- Adaptation: measure variance in approaches
        COALESCE(STDDEV(prompt_quality_score), 10) as adaptation_raw,

        -- Critical Thinking: based on pushback and clarification
        COALESCE(COUNT(*) FILTER (WHERE has_pushback = true OR has_clarification_request = true)::float / NULLIF(COUNT(*), 0) * 100, 0) as critical_thinking,

        COUNT(DISTINCT session_id) as session_count,
        COUNT(*) as interaction_count

      FROM recent_behavior
    )
    SELECT * FROM skill_metrics
  `;

  const skillResult = await db.query(skillQuery, [userId]);
  const metrics = skillResult.rows[0];

  if (!metrics || metrics.session_count === 0) {
    return; // No activity, skip
  }

  // Normalize and calculate overall score
  const promptEngineering = Math.min(100, parseFloat(metrics.prompt_engineering));
  const outputEvaluation = Math.min(100, parseFloat(metrics.output_evaluation));
  const verification = Math.min(100, parseFloat(metrics.verification));
  const iteration = Math.min(100, parseFloat(metrics.iteration));
  const adaptation = Math.min(100, 50 + parseFloat(metrics.adaptation_raw) * 2);
  const criticalThinking = Math.min(100, parseFloat(metrics.critical_thinking));

  const overallScore = (
    promptEngineering * 0.2 +
    outputEvaluation * 0.2 +
    verification * 0.15 +
    iteration * 0.15 +
    adaptation * 0.15 +
    criticalThinking * 0.15
  );

  // Calculate trajectory from previous snapshots
  const trajectoryQuery = `
    SELECT overall_skill_score, date
    FROM skill_snapshots
    WHERE user_id = $1
    ORDER BY date DESC
    LIMIT 7
  `;

  const trajectoryResult = await db.query(trajectoryQuery, [userId]);
  const previousScores = trajectoryResult.rows;

  let trajectoryScore = 0;
  let trajectoryDirection: 'accelerating' | 'steady' | 'plateauing' | 'declining' = 'steady';
  let daysSinceImprovement = 0;

  if (previousScores.length >= 2) {
    const recentChange = overallScore - parseFloat(previousScores[0].overall_skill_score);
    const previousChange = parseFloat(previousScores[0].overall_skill_score) - parseFloat(previousScores[1].overall_skill_score);

    trajectoryScore = recentChange;

    if (recentChange > 1 && recentChange > previousChange) trajectoryDirection = 'accelerating';
    else if (recentChange > 0.5) trajectoryDirection = 'steady';
    else if (Math.abs(recentChange) < 0.5) trajectoryDirection = 'plateauing';
    else trajectoryDirection = 'declining';

    // Calculate days since meaningful improvement
    for (let i = 0; i < previousScores.length; i++) {
      if (parseFloat(previousScores[i].overall_skill_score) < overallScore - 1) {
        break;
      }
      daysSinceImprovement = i + 1;
    }
  }

  // Calculate percentiles
  const percentileQuery = `
    SELECT
      PERCENT_RANK() OVER (ORDER BY ss.overall_skill_score) * 100 as org_percentile
    FROM skill_snapshots ss
    JOIN users u ON ss.user_id = u.id
    WHERE u.organization_id = $1
      AND ss.date = (SELECT MAX(date) FROM skill_snapshots WHERE user_id = ss.user_id)
  `;

  const percentileResult = await db.query(percentileQuery, [organizationId]);
  const percentileInOrg = percentileResult.rows[0]?.org_percentile || 50;

  // Insert snapshot
  const insertQuery = `
    INSERT INTO skill_snapshots (
      user_id, date, overall_skill_score,
      skill_prompt_engineering, skill_output_evaluation, skill_verification,
      skill_iteration, skill_adaptation, skill_critical_thinking,
      trajectory_score, trajectory_direction, days_since_improvement,
      percentile_in_org,
      sessions_in_period, interactions_in_period
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      overall_skill_score = EXCLUDED.overall_skill_score,
      skill_prompt_engineering = EXCLUDED.skill_prompt_engineering,
      skill_output_evaluation = EXCLUDED.skill_output_evaluation,
      skill_verification = EXCLUDED.skill_verification,
      skill_iteration = EXCLUDED.skill_iteration,
      skill_adaptation = EXCLUDED.skill_adaptation,
      skill_critical_thinking = EXCLUDED.skill_critical_thinking,
      trajectory_score = EXCLUDED.trajectory_score,
      trajectory_direction = EXCLUDED.trajectory_direction,
      days_since_improvement = EXCLUDED.days_since_improvement,
      percentile_in_org = EXCLUDED.percentile_in_org
  `;

  await db.query(insertQuery, [
    userId, today, overallScore,
    promptEngineering, outputEvaluation, verification,
    iteration, adaptation, criticalThinking,
    trajectoryScore, trajectoryDirection, daysSinceImprovement,
    percentileInOrg,
    parseInt(metrics.session_count), parseInt(metrics.interaction_count),
  ]);

  // Check for and record competency milestones
  await checkCompetencyMilestones(userId, overallScore);

  // Update learning velocity
  await updateLearningVelocity(userId);
}

async function checkCompetencyMilestones(userId: string, currentScore: number): Promise<void> {
  const milestones = [
    { type: 'reached_baseline', threshold: 50 },
    { type: 'reached_competent', threshold: 70 },
    { type: 'reached_proficient', threshold: 85 },
    { type: 'reached_expert', threshold: 95 },
  ];

  for (const milestone of milestones) {
    // Check if already achieved
    const existsQuery = `
      SELECT 1 FROM competency_events
      WHERE user_id = $1 AND event_type = $2
    `;
    const exists = await db.query(existsQuery, [userId, milestone.type]);

    if (exists.rows.length === 0 && currentScore >= milestone.threshold) {
      // Record new milestone
      const insertQuery = `
        INSERT INTO competency_events (
          user_id, event_type, milestone_name, milestone_value,
          days_since_first_use, total_sessions, total_interactions, occurred_at
        )
        SELECT
          $1, $2, $3, $4,
          COALESCE(EXTRACT(DAY FROM NOW() - MIN(ce.occurred_at)), 0)::integer,
          COALESCE(COUNT(DISTINCT bs.session_id), 0)::integer,
          COALESCE(COUNT(bs.id), 0)::integer,
          NOW()
        FROM competency_events ce
        FULL OUTER JOIN behavioral_signals bs ON bs.user_id = $1
        WHERE ce.user_id = $1 AND ce.event_type = 'first_interaction'
        GROUP BY ce.user_id
      `;

      await db.query(insertQuery, [
        userId, milestone.type, milestone.type.replace(/_/g, ' '), currentScore,
      ]);
    }
  }
}

async function updateLearningVelocity(userId: string): Promise<void> {
  const velocityQuery = `
    WITH score_changes AS (
      SELECT
        date,
        overall_skill_score,
        overall_skill_score - LAG(overall_skill_score) OVER (ORDER BY date) as daily_change
      FROM skill_snapshots
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 90
    ),
    velocities AS (
      SELECT
        AVG(daily_change) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days') * 7 as velocity_7d,
        AVG(daily_change) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '14 days') * 7 as velocity_14d,
        AVG(daily_change) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') * 7 as velocity_30d,
        AVG(daily_change) * 7 as velocity_90d
      FROM score_changes
      WHERE daily_change IS NOT NULL
    )
    SELECT * FROM velocities
  `;

  const velocityResult = await db.query(velocityQuery, [userId]);
  const velocity = velocityResult.rows[0];

  if (!velocity) return;

  // Calculate acceleration (change in velocity)
  const prevVelocityQuery = `
    SELECT velocity_30d
    FROM learning_velocity
    WHERE user_id = $1
    ORDER BY calculated_at DESC
    LIMIT 1
  `;
  const prevResult = await db.query(prevVelocityQuery, [userId]);
  const prevVelocity = prevResult.rows[0]?.velocity_30d || 0;
  const acceleration = (parseFloat(velocity.velocity_30d) || 0) - prevVelocity;

  // Insert velocity record
  const insertQuery = `
    INSERT INTO learning_velocity (
      user_id, velocity_7d, velocity_14d, velocity_30d, velocity_90d,
      acceleration, calculated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `;

  await db.query(insertQuery, [
    userId,
    parseFloat(velocity.velocity_7d) || 0,
    parseFloat(velocity.velocity_14d) || 0,
    parseFloat(velocity.velocity_30d) || 0,
    parseFloat(velocity.velocity_90d) || 0,
    acceleration,
  ]);

  // Update rankings (separate query for efficiency)
  await updateVelocityRankings(userId);
}

async function updateVelocityRankings(userId: string): Promise<void> {
  const rankQuery = `
    WITH latest_velocities AS (
      SELECT DISTINCT ON (lv.user_id)
        lv.user_id,
        lv.id,
        lv.velocity_30d,
        u.organization_id,
        u.team_id
      FROM learning_velocity lv
      JOIN users u ON lv.user_id = u.id
      ORDER BY lv.user_id, lv.calculated_at DESC
    ),
    ranked AS (
      SELECT
        id,
        RANK() OVER (PARTITION BY organization_id ORDER BY velocity_30d DESC) as rank_in_org,
        RANK() OVER (PARTITION BY organization_id, team_id ORDER BY velocity_30d DESC) as rank_in_team,
        PERCENT_RANK() OVER (PARTITION BY organization_id ORDER BY velocity_30d) * 100 as percentile_in_org,
        PERCENT_RANK() OVER (PARTITION BY organization_id, team_id ORDER BY velocity_30d) * 100 as percentile_in_team
      FROM latest_velocities
      WHERE user_id = $1
    )
    UPDATE learning_velocity lv SET
      rank_in_org = r.rank_in_org,
      rank_in_team = r.rank_in_team,
      percentile_in_org = r.percentile_in_org,
      percentile_in_team = r.percentile_in_team
    FROM ranked r
    WHERE lv.id = r.id
  `;

  await db.query(rankQuery, [userId]);
}

// Export for use in a scheduler or CLI
export default runSkillSnapshotJob;
