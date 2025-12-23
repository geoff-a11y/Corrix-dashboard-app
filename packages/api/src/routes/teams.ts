import { Router } from 'express';
import { TeamAnalyticsService } from '../services/TeamAnalyticsService.js';
import { cacheRankings, cacheLists } from '../middleware/cache.js';
import db from '../db/connection.js';

const router = Router();
const teamService = new TeamAnalyticsService();

/**
 * GET /api/teams/list
 * Returns list of teams for dropdown selection
 */
router.get('/list', cacheLists, async (req, res) => {
  try {
    const { organizationId } = req.query;

    const result = await db.query(
      `SELECT id, name
       FROM teams
       WHERE organization_id = $1
       ORDER BY name`,
      [organizationId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[Teams] List error:', error);
    res.status(500).json({ error: 'Failed to fetch teams list' });
  }
});

/**
 * GET /api/v1/teams/comparison
 * Capability #34: Team Comparison Dashboard
 */
router.get('/comparison', cacheRankings, async (req, res) => {
  try {
    const { organizationId, teamIds, startDate, endDate } = req.query;

    // Parse teamIds if provided as comma-separated string
    const teamIdList = teamIds
      ? (teamIds as string).split(',')
      : undefined;

    const comparison = await teamService.getTeamComparison({
      organizationId: organizationId as string,
      teamIds: teamIdList,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(comparison);
  } catch (error) {
    console.error('[Teams] Comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch team comparison' });
  }
});

/**
 * GET /api/v1/teams/ranking
 * Returns teams ranked by Corrix score
 */
router.get('/ranking', cacheRankings, async (req, res) => {
  try {
    const { organizationId, sortBy, limit } = req.query;

    const ranking = await teamService.getTeamRanking({
      organizationId: organizationId as string,
      sortBy: (sortBy as string) || 'corrixScore',
      limit: parseInt(limit as string) || 10,
    });

    res.json(ranking);
  } catch (error) {
    console.error('[Teams] Ranking error:', error);
    res.status(500).json({ error: 'Failed to fetch team ranking' });
  }
});

/**
 * GET /api/v1/teams/:teamId/analytics
 * Detailed analytics for a specific team
 */
router.get('/:teamId/analytics', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = await teamService.getTeamAnalytics({
      teamId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analytics);
  } catch (error) {
    console.error('[Teams] Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
});

export default router;
