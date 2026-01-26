import { Router } from 'express';
import { AlertService } from '../services/AlertService.js';

const router = Router();
const alertService = new AlertService();

/**
 * GET /api/alerts
 * Get aggregated alerts from multiple sources
 * Query params:
 *   - organizationId: Filter by organization
 *   - teamId: Filter by team
 *   - limit: Number of alerts to return (default: 10)
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId, teamId, limit } = req.query;

    const alerts = await alertService.getAlerts({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      limit: limit ? parseInt(limit as string) : 10,
    });

    res.json(alerts);
  } catch (error) {
    console.error('[Alerts] Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/alerts/recommendations
 * Get top actionable recommendations
 * Query params:
 *   - organizationId: Filter by organization
 *   - teamId: Filter by team
 *   - limit: Number of recommendations to return (default: 5)
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { organizationId, teamId, limit } = req.query;

    const recommendations = await alertService.getRecommendations({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      limit: limit ? parseInt(limit as string) : 5,
    });

    res.json(recommendations);
  } catch (error) {
    console.error('[Alerts] Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
