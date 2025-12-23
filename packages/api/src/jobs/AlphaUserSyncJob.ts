import db from '../db/connection.js';
import { runAlphaUserSync, getAlphaSyncStatus } from '../services/AlphaUserSyncService.js';

/**
 * Job to sync alpha users from Supabase to dashboard database
 * Run every 15 minutes via cron: *\/15 * * * *
 *
 * This job pulls user data from the Chrome extension's Supabase
 * and syncs it into the dashboard's PostgreSQL database.
 */
export async function runAlphaUserSyncJob(): Promise<void> {
  console.log('[AlphaUserSyncJob] Starting alpha user sync...');
  const startTime = Date.now();
  const jobId = await logJobStart('alpha-user-sync');

  try {
    const result = await runAlphaUserSync();
    const duration = Date.now() - startTime;

    await logJobComplete(jobId, result.synced);
    console.log(`[AlphaUserSyncJob] Completed: ${result.synced} synced, ${result.errors} errors, ${duration}ms`);

    if (result.errors > 0) {
      console.warn(`[AlphaUserSyncJob] ${result.errors} users failed to sync`);
    }
  } catch (error) {
    await logJobError(jobId, error as Error);
    console.error('[AlphaUserSyncJob] Fatal error:', error);
    throw error;
  }
}

/**
 * Get current sync status (useful for health checks)
 */
export async function getAlphaUserSyncJobStatus(): Promise<{
  configured: boolean;
  alphaOrgExists: boolean;
  userCount: number;
  lastRun: Date | null;
}> {
  const syncStatus = await getAlphaSyncStatus();

  // Get last successful run
  const lastRunResult = await db.query(
    `SELECT completed_at FROM aggregation_job_logs
     WHERE job_name = 'alpha-user-sync' AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`
  );
  const lastRun = lastRunResult.rows[0]?.completed_at || null;

  return { ...syncStatus, lastRun };
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

export default runAlphaUserSyncJob;
