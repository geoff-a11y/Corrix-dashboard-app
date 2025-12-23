import db from '../db/connection.js';

/**
 * Daily job to pre-compute score trend aggregations
 * Run at 4 AM UTC via cron: 0 4 * * *
 *
 * This job pre-computes daily, weekly, and monthly score trends
 * at organization, team, and user levels for faster dashboard queries.
 */
export async function runScoreTrendAggregationJob(): Promise<void> {
  console.log('[ScoreTrendAggregationJob] Starting score trend aggregation...');
  const startTime = Date.now();
  const jobId = await logJobStart('score-trend-aggregation');

  try {
    let recordsProcessed = 0;

    // Aggregate organization-level trends
    recordsProcessed += await aggregateOrganizationTrends();

    // Aggregate team-level trends
    recordsProcessed += await aggregateTeamTrends();

    // Aggregate user-level trends (for individual analysis)
    recordsProcessed += await aggregateUserTrends();

    const duration = Date.now() - startTime;
    await logJobComplete(jobId, recordsProcessed);
    console.log(`[ScoreTrendAggregationJob] Completed: ${recordsProcessed} records, ${duration}ms`);
  } catch (error) {
    await logJobError(jobId, error as Error);
    console.error('[ScoreTrendAggregationJob] Fatal error:', error);
    throw error;
  }
}

async function aggregateOrganizationTrends(): Promise<number> {
  console.log('[ScoreTrendAggregationJob] Aggregating organization trends...');

  const query = `
    WITH daily_aggregates AS (
      SELECT
        u.organization_id as scope_id,
        ds.score_date as period_date,
        'corrix' as metric_name,
        AVG(ds.corrix_score) as avg_value,
        MIN(ds.corrix_score) as min_value,
        MAX(ds.corrix_score) as max_value,
        COUNT(*) as sample_count
      FROM daily_scores ds
      JOIN users u ON ds.user_id = u.id
      WHERE ds.score_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY u.organization_id, ds.score_date
    ),
    with_change AS (
      SELECT
        da.*,
        (da.avg_value - LAG(da.avg_value) OVER (
          PARTITION BY da.scope_id
          ORDER BY da.period_date
        )) / NULLIF(LAG(da.avg_value) OVER (
          PARTITION BY da.scope_id
          ORDER BY da.period_date
        ), 0) * 100 as change_percentage
      FROM daily_aggregates da
    )
    INSERT INTO score_trend_aggregations (
      scope_type, scope_id, period_type, period_date, metric_name,
      avg_value, min_value, max_value, sample_count, change_percentage
    )
    SELECT
      'organization', scope_id, 'day', period_date, metric_name,
      avg_value, min_value, max_value, sample_count, change_percentage
    FROM with_change
    ON CONFLICT (scope_type, scope_id, period_type, period_date, metric_name)
    DO UPDATE SET
      avg_value = EXCLUDED.avg_value,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      sample_count = EXCLUDED.sample_count,
      change_percentage = EXCLUDED.change_percentage,
      updated_at = CURRENT_TIMESTAMP
  `;

  const result = await db.query(query);
  return result.rowCount || 0;
}

async function aggregateTeamTrends(): Promise<number> {
  console.log('[ScoreTrendAggregationJob] Aggregating team trends...');

  const query = `
    WITH daily_aggregates AS (
      SELECT
        tm.team_id as scope_id,
        ds.score_date as period_date,
        'corrix' as metric_name,
        AVG(ds.corrix_score) as avg_value,
        MIN(ds.corrix_score) as min_value,
        MAX(ds.corrix_score) as max_value,
        COUNT(*) as sample_count
      FROM daily_scores ds
      JOIN team_members tm ON ds.user_id = tm.user_id
      WHERE ds.score_date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY tm.team_id, ds.score_date
    ),
    with_change AS (
      SELECT
        da.*,
        (da.avg_value - LAG(da.avg_value) OVER (
          PARTITION BY da.scope_id
          ORDER BY da.period_date
        )) / NULLIF(LAG(da.avg_value) OVER (
          PARTITION BY da.scope_id
          ORDER BY da.period_date
        ), 0) * 100 as change_percentage
      FROM daily_aggregates da
    )
    INSERT INTO score_trend_aggregations (
      scope_type, scope_id, period_type, period_date, metric_name,
      avg_value, min_value, max_value, sample_count, change_percentage
    )
    SELECT
      'team', scope_id, 'day', period_date, metric_name,
      avg_value, min_value, max_value, sample_count, change_percentage
    FROM with_change
    ON CONFLICT (scope_type, scope_id, period_type, period_date, metric_name)
    DO UPDATE SET
      avg_value = EXCLUDED.avg_value,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      sample_count = EXCLUDED.sample_count,
      change_percentage = EXCLUDED.change_percentage,
      updated_at = CURRENT_TIMESTAMP
  `;

  const result = await db.query(query);
  return result.rowCount || 0;
}

async function aggregateUserTrends(): Promise<number> {
  console.log('[ScoreTrendAggregationJob] Aggregating user trends...');

  const query = `
    WITH daily_aggregates AS (
      SELECT
        ds.user_id as scope_id,
        ds.score_date as period_date,
        'corrix' as metric_name,
        ds.corrix_score as avg_value,
        ds.corrix_score as min_value,
        ds.corrix_score as max_value,
        1 as sample_count
      FROM daily_scores ds
      WHERE ds.score_date >= CURRENT_DATE - INTERVAL '90 days'
    ),
    with_change AS (
      SELECT
        da.*,
        (da.avg_value - LAG(da.avg_value) OVER (
          PARTITION BY da.scope_id
          ORDER BY da.period_date
        )) / NULLIF(LAG(da.avg_value) OVER (
          PARTITION BY da.scope_id
          ORDER BY da.period_date
        ), 0) * 100 as change_percentage
      FROM daily_aggregates da
    )
    INSERT INTO score_trend_aggregations (
      scope_type, scope_id, period_type, period_date, metric_name,
      avg_value, min_value, max_value, sample_count, change_percentage
    )
    SELECT
      'user', scope_id, 'day', period_date, metric_name,
      avg_value, min_value, max_value, sample_count, change_percentage
    FROM with_change
    ON CONFLICT (scope_type, scope_id, period_type, period_date, metric_name)
    DO UPDATE SET
      avg_value = EXCLUDED.avg_value,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      sample_count = EXCLUDED.sample_count,
      change_percentage = EXCLUDED.change_percentage,
      updated_at = CURRENT_TIMESTAMP
  `;

  const result = await db.query(query);
  return result.rowCount || 0;
}

async function logJobStart(jobName: string): Promise<string> {
  const result = await db.query(
    `INSERT INTO aggregation_job_logs (job_name, started_at, status)
     VALUES ($1, NOW(), 'running')
     RETURNING id`,
    [jobName]
  );
  return result.rows[0].id;
}

async function logJobComplete(jobId: string, recordsProcessed: number): Promise<void> {
  await db.query(
    `UPDATE aggregation_job_logs
     SET completed_at = NOW(), status = 'completed', records_processed = $2
     WHERE id = $1`,
    [jobId, recordsProcessed]
  );
}

async function logJobError(jobId: string, error: Error): Promise<void> {
  await db.query(
    `UPDATE aggregation_job_logs
     SET completed_at = NOW(), status = 'failed', error_message = $2
     WHERE id = $1`,
    [jobId, error.message]
  );
}

export default runScoreTrendAggregationJob;
