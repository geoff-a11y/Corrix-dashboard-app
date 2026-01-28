import db from '../db/connection.js';
import { getSupabaseClient, isSupabaseConfigured } from '../cloud/supabase.js';

// Fixed UUIDs for Corrix Beta org/team (deterministic for idempotent seeding)
// Using distinct UUIDs to avoid conflict with demo data
const ALPHA_ORG_ID = 'a1fa0000-0000-0000-0000-000000000001';
const ALPHA_TEAM_ID = 'a1fa0000-0000-0000-0000-000000000002';
const ALPHA_ORG_NAME = 'Corrix Beta';
const ALPHA_TEAM_NAME = 'Beta Testers';

interface AlphaUser {
  id: string;
  user_id: string;
  email: string;
  latest_corrix_score: number | null;
  latest_results_score: number | null;
  latest_relationship_score: number | null;
  latest_resilience_score: number | null;
  mode_approving_pct: number | null;
  mode_consulting_pct: number | null;
  mode_supervising_pct: number | null;
  mode_delegating_pct: number | null;
  baseline_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Ensure the Corrix Beta organization and team exist
 */
export async function ensureAlphaOrganization(): Promise<void> {
  // Create or update organization
  await db.query(
    `INSERT INTO organizations (id, name, domain, settings)
     VALUES ($1, $2, 'beta.corrix.io', '{"isBetaOrg": true}')
     ON CONFLICT (id) DO UPDATE SET name = $2`,
    [ALPHA_ORG_ID, ALPHA_ORG_NAME]
  );

  // Create or update team
  await db.query(
    `INSERT INTO teams (id, organization_id, name, settings)
     VALUES ($1, $2, $3, '{"isBetaTeam": true}')
     ON CONFLICT (id) DO UPDATE SET name = $3`,
    [ALPHA_TEAM_ID, ALPHA_ORG_ID, ALPHA_TEAM_NAME]
  );

  console.log('[AlphaUserSync] Corrix Beta org/team ensured');
}

/**
 * Fetch all alpha users from Supabase
 */
async function fetchAlphaUsers(): Promise<AlphaUser[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('alpha_users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch alpha users: ${error.message}`);
  }

  return data || [];
}

/**
 * Sync a single alpha user to the dashboard database
 */
async function syncUser(alphaUser: AlphaUser): Promise<boolean> {
  const anonymousId = `alpha_${alphaUser.user_id}`;
  const today = new Date().toISOString().split('T')[0];

  // Upsert user record
  const userResult = await db.query(
    `INSERT INTO users (id, organization_id, team_id, anonymous_id, privacy_tier, last_seen_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'research', NOW())
     ON CONFLICT (anonymous_id) DO UPDATE SET
       organization_id = $1,
       team_id = $2,
       last_seen_at = NOW()
     RETURNING id`,
    [ALPHA_ORG_ID, ALPHA_TEAM_ID, anonymousId]
  );

  const userId = userResult.rows[0].id;

  // Only sync scores if they have completed baseline
  if (alphaUser.baseline_completed && alphaUser.latest_corrix_score !== null) {
    await db.query(
      `INSERT INTO daily_scores (
         user_id, date, corrix_score, results_score, relationship_score, resilience_score, signal_count
       )
       VALUES ($1, $2, $3, $4, $5, $6, 1)
       ON CONFLICT (user_id, date) DO UPDATE SET
         corrix_score = $3,
         results_score = $4,
         relationship_score = $5,
         resilience_score = $6,
         updated_at = NOW()`,
      [
        userId,
        today,
        alphaUser.latest_corrix_score,
        alphaUser.latest_results_score,
        alphaUser.latest_relationship_score,
        alphaUser.latest_resilience_score,
      ]
    );
  }

  return true;
}

/**
 * Run the full alpha user sync
 */
export async function runAlphaUserSync(): Promise<{ synced: number; errors: number }> {
  console.log('[AlphaUserSync] Starting sync...');

  // Always ensure org/team exist (even without Supabase)
  await ensureAlphaOrganization();

  if (!isSupabaseConfigured()) {
    console.warn('[AlphaUserSync] Supabase not configured, skipping user sync');
    return { synced: 0, errors: 0 };
  }

  // Fetch and sync users
  const alphaUsers = await fetchAlphaUsers();
  console.log(`[AlphaUserSync] Found ${alphaUsers.length} alpha users`);

  let synced = 0;
  let errors = 0;

  for (const user of alphaUsers) {
    try {
      await syncUser(user);
      synced++;
    } catch (error) {
      console.error(`[AlphaUserSync] Error syncing user ${user.user_id}:`, error);
      errors++;
    }
  }

  console.log(`[AlphaUserSync] Completed: ${synced} synced, ${errors} errors`);
  return { synced, errors };
}

/**
 * Get sync status
 */
export async function getAlphaSyncStatus(): Promise<{
  configured: boolean;
  alphaOrgExists: boolean;
  userCount: number;
}> {
  const configured = isSupabaseConfigured();

  const orgResult = await db.query(
    `SELECT COUNT(*) FROM organizations WHERE id = $1`,
    [ALPHA_ORG_ID]
  );
  const alphaOrgExists = parseInt(orgResult.rows[0].count) > 0;

  const userResult = await db.query(
    `SELECT COUNT(*) FROM users WHERE organization_id = $1`,
    [ALPHA_ORG_ID]
  );
  const userCount = parseInt(userResult.rows[0].count);

  return { configured, alphaOrgExists, userCount };
}

export { ALPHA_ORG_ID, ALPHA_TEAM_ID };
