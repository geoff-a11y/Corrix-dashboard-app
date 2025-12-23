import db from '../db/connection.js';

/**
 * Daily job to pre-compute team rankings
 * Run at 4:30 AM UTC via cron: 30 4 * * *
 *
 * This job pre-computes daily team rankings within each organization
 * for faster dashboard queries and trend tracking.
 */
export async function runTeamRankingAggregationJob(): Promise<void> {
  console.log('[TeamRankingAggregationJob] Starting team ranking aggregation...');
  const startTime = Date.now();
  const jobId = await logJobStart('team-ranking-aggregation');

  try {
    let recordsProcessed = 0;

    // Get all organizations
    const orgsResult = await db.query('SELECT id FROM organizations');

    for (const org of orgsResult.rows) {
      try {
        const count = await aggregateTeamRankingsForOrg(org.id);
        recordsProcessed += count;
      } catch (error) {
        console.error(`[TeamRankingAggregationJob] Error processing org ${org.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    await logJobComplete(jobId, recordsProcessed);
    console.log(`[TeamRankingAggregationJob] Completed: ${recordsProcessed} records, ${duration}ms`);
  } catch (error) {
    await logJobError(jobId, error as Error);
    console.error('[TeamRankingAggregationJob] Fatal error:', error);
    throw error;
  }
}

async function aggregateTeamRankingsForOrg(organizationId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  // Calculate team rankings based on average scores
  const query = `
    WITH team_scores AS (
      SELECT
        t.id as team_id,
        t.organization_id,
        AVG(ds.corrix_score) as corrix_score,
        AVG(ds.results_score) as results_score,
        AVG(ds.relationship_score) as relationship_score,
        AVG(ds.resilience_score) as resilience_score,
        COUNT(DISTINCT ds.user_id) as user_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN daily_scores ds ON tm.user_id = ds.user_id
        AND ds.score_date >= CURRENT_DATE - INTERVAL '7 days'
      WHERE t.organization_id = $1
      GROUP BY t.id, t.organization_id
    ),
    ranked AS (
      SELECT
        ts.*,
        ROW_NUMBER() OVER (ORDER BY ts.corrix_score DESC NULLS LAST) as rank
      FROM team_scores ts
    ),
    with_previous AS (
      SELECT
        r.*,
        prev.rank as previous_rank
      FROM ranked r
      LEFT JOIN team_ranking_snapshots prev ON
        r.team_id = prev.team_id
        AND prev.snapshot_date = CURRENT_DATE - INTERVAL '1 day'
    ),
    with_trend AS (
      SELECT
        wp.*,
        CASE
          WHEN wp.previous_rank IS NULL THEN 'stable'
          WHEN wp.rank < wp.previous_rank THEN 'up'
          WHEN wp.rank > wp.previous_rank THEN 'down'
          ELSE 'stable'
        END as trend
      FROM with_previous wp
    )
    INSERT INTO team_ranking_snapshots (
      organization_id, team_id, snapshot_date, rank, previous_rank,
      corrix_score, results_score, relationship_score, resilience_score,
      user_count, trend
    )
    SELECT
      organization_id, team_id, $2::date, rank, previous_rank,
      COALESCE(corrix_score, 0), COALESCE(results_score, 0),
      COALESCE(relationship_score, 0), COALESCE(resilience_score, 0),
      user_count, trend
    FROM with_trend
    ON CONFLICT (organization_id, team_id, snapshot_date)
    DO UPDATE SET
      rank = EXCLUDED.rank,
      previous_rank = EXCLUDED.previous_rank,
      corrix_score = EXCLUDED.corrix_score,
      results_score = EXCLUDED.results_score,
      relationship_score = EXCLUDED.relationship_score,
      resilience_score = EXCLUDED.resilience_score,
      user_count = EXCLUDED.user_count,
      trend = EXCLUDED.trend
  `;

  const result = await db.query(query, [organizationId, today]);
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

export default runTeamRankingAggregationJob;
