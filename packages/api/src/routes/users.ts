import { Router } from 'express';
import { cacheLists, cacheDistributions } from '../middleware/cache.js';
import db from '../db/connection.js';

const router = Router();

/**
 * Generate anonymized display ID from UUID
 * Format: "User #A1B2" (last 4 chars of UUID uppercased)
 */
function anonymizeUserId(uuid: string): string {
  return `User #${uuid.slice(-4).toUpperCase()}`;
}

/**
 * GET /api/users/list
 * Returns list of users with anonymized display IDs for dropdown selection
 */
router.get('/list', cacheLists, async (req, res) => {
  try {
    const { organizationId, teamId } = req.query;

    let query: string;
    let params: (string | undefined)[];

    if (teamId) {
      // Get users in a specific team
      query = `
        SELECT DISTINCT u.id
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = $1
        ORDER BY u.id
      `;
      params = [teamId as string];
    } else if (organizationId) {
      // Get users in an organization (through teams)
      query = `
        SELECT DISTINCT u.id
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        JOIN teams t ON tm.team_id = t.id
        WHERE t.organization_id = $1
        ORDER BY u.id
      `;
      params = [organizationId as string];
    } else {
      return res.status(400).json({ error: 'organizationId or teamId required' });
    }

    const result = await db.query(query, params);

    const users = result.rows.map(row => ({
      id: row.id,
      displayId: anonymizeUserId(row.id),
    }));

    res.json(users);
  } catch (error) {
    console.error('[Users] List error:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

/**
 * GET /api/users/:userId/summary
 * Returns basic summary stats for a specific user
 */
router.get('/:userId/summary', cacheDistributions, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get latest scores and basic stats
    const result = await db.query(
      `SELECT
        ds.corrix_score,
        ds.results_score,
        ds.relationship_score,
        ds.resilience_score,
        ds.score_date
       FROM daily_scores ds
       WHERE ds.user_id = $1
       ORDER BY ds.score_date DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        userId,
        displayId: anonymizeUserId(userId),
        hasData: false,
      });
    }

    const row = result.rows[0];
    res.json({
      userId,
      displayId: anonymizeUserId(userId),
      hasData: true,
      latestScore: {
        corrixScore: parseFloat(row.corrix_score),
        results: parseFloat(row.results_score),
        relationship: parseFloat(row.relationship_score),
        resilience: parseFloat(row.resilience_score),
        date: row.score_date,
      },
    });
  } catch (error) {
    console.error('[Users] Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch user summary' });
  }
});

export default router;
