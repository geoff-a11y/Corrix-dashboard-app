import { Router } from 'express';
import { TargetingConfigService } from '../services/TargetingConfigService.js';

const router = Router();
const targetingService = new TargetingConfigService();

/**
 * GET /api/targeting/config
 * Get current targeting configuration
 */
router.get('/config', async (req, res) => {
  try {
    const config = await targetingService.getCurrentConfig();

    if (!config) {
      // Return default empty config if none exists
      res.json({
        version: 0,
        rules: [],
        globalDisabled: [],
        updatedAt: null,
      });
      return;
    }

    res.json(config);
  } catch (error) {
    console.error('[Targeting] Get config error:', error);
    res.status(500).json({ error: 'Failed to fetch targeting config' });
  }
});

/**
 * PUT /api/targeting/config
 * Update targeting configuration (creates new version)
 */
router.put('/config', async (req, res) => {
  try {
    const { rules, globalDisabled, notes } = req.body;
    const userId = (req as any).user?.id;

    const config = await targetingService.updateConfig({
      rules,
      globalDisabled,
      notes,
      createdBy: userId,
    });

    res.json(config);
  } catch (error) {
    console.error('[Targeting] Update config error:', error);
    res.status(500).json({ error: 'Failed to update targeting config' });
  }
});

/**
 * POST /api/targeting/toggle/:coachingType
 * Toggle a coaching type's enabled/disabled status
 */
router.post('/toggle/:coachingType', async (req, res) => {
  try {
    const { coachingType } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled must be a boolean' });
      return;
    }

    const config = await targetingService.toggleCoachingType(coachingType, enabled);
    res.json(config);
  } catch (error) {
    console.error('[Targeting] Toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle coaching type' });
  }
});

/**
 * PUT /api/targeting/rules/:coachingType
 * Update a specific coaching type's targeting rule
 */
router.put('/rules/:coachingType', async (req, res) => {
  try {
    const { coachingType } = req.params;
    const rule = req.body;

    const config = await targetingService.updateRule(coachingType, rule);
    res.json(config);
  } catch (error) {
    console.error('[Targeting] Update rule error:', error);
    res.status(500).json({ error: 'Failed to update targeting rule' });
  }
});

/**
 * GET /api/targeting/history
 * Get targeting config version history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await targetingService.getConfigHistory(limit);
    res.json(history);
  } catch (error) {
    console.error('[Targeting] Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch config history' });
  }
});

export default router;
