import { Router } from 'express';
import { TemporalIndicatorService } from '../services/TemporalIndicatorService.js';

const router = Router();
const temporalService = new TemporalIndicatorService();

/**
 * GET /api/temporal/dashboard
 * Capability #6: Temporal Indicator Dashboard
 *
 * Returns all indicators grouped by temporality (leading/concurrent/lagging)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { organizationId, teamId, userId, date } = req.query;

    const dashboard = await temporalService.getIndicatorDashboard({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      date: date as string | undefined,
    });

    res.json(dashboard);
  } catch (error) {
    console.error('[Temporal] Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch temporal indicators' });
  }
});

/**
 * GET /api/temporal/indicators/:name/trend
 *
 * Get trend data for a specific indicator
 */
router.get('/indicators/:name/trend', async (req, res) => {
  try {
    const { name } = req.params;
    const { organizationId, teamId, userId, days } = req.query;

    const trend = await temporalService.getIndicatorTrend({
      indicatorName: name,
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      days: parseInt(days as string) || 30,
    });

    res.json(trend);
  } catch (error) {
    console.error('[Temporal] Trend error:', error);
    res.status(500).json({ error: 'Failed to fetch indicator trend' });
  }
});

/**
 * GET /api/temporal/leading/alerts
 *
 * Get leading indicators that are in warning/critical state
 */
router.get('/leading/alerts', async (req, res) => {
  try {
    const { organizationId, teamId, severity } = req.query;

    const alerts = await temporalService.getLeadingIndicatorAlerts({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      severity: severity as 'warning' | 'critical' | undefined,
    });

    res.json(alerts);
  } catch (error) {
    console.error('[Temporal] Alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch leading indicator alerts' });
  }
});

/**
 * GET /api/temporal/correlations
 *
 * Get correlation matrix between leading and lagging indicators
 */
router.get('/correlations', async (req, res) => {
  try {
    const { organizationId } = req.query;

    const correlations = await temporalService.getIndicatorCorrelations({
      organizationId: organizationId as string,
    });

    res.json(correlations);
  } catch (error) {
    console.error('[Temporal] Correlations error:', error);
    res.status(500).json({ error: 'Failed to fetch indicator correlations' });
  }
});

export default router;
