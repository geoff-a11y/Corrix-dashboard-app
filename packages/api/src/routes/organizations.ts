import { Router } from 'express';
import { OrganizationService } from '../services/OrganizationService.js';
import db from '../db/connection.js';

const router = Router();
const orgService = new OrganizationService();

/**
 * GET /api/organizations/list
 * Returns list of organizations for dropdown selection
 */
router.get('/list', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, domain
       FROM organizations
       ORDER BY name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[Organizations] List error:', error);
    res.status(500).json({ error: 'Failed to fetch organizations list' });
  }
});

/**
 * GET /api/v1/organizations/:orgId/adoption
 * Capability #38: Adoption Curve Tracking
 */
router.get('/:orgId/adoption', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { startDate, endDate, granularity } = req.query;

    const adoption = await orgService.getAdoptionMetrics({
      organizationId: orgId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      granularity: (granularity as 'day' | 'week' | 'month') || 'day',
    });

    res.json(adoption);
  } catch (error) {
    console.error('[Organizations] Adoption error:', error);
    res.status(500).json({ error: 'Failed to fetch adoption metrics' });
  }
});

/**
 * GET /api/v1/organizations/:orgId/summary
 * Organization-wide summary metrics
 */
router.get('/:orgId/summary', async (req, res) => {
  try {
    const { orgId } = req.params;

    const summary = await orgService.getOrganizationSummary(orgId);

    res.json(summary);
  } catch (error) {
    console.error('[Organizations] Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch organization summary' });
  }
});

export default router;
