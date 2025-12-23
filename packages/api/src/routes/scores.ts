import { Router } from 'express';
import { ScoreAggregationService } from '../services/ScoreAggregationService.js';
import { cacheDistributions, cacheTrends } from '../middleware/cache.js';

const router = Router();
const scoreService = new ScoreAggregationService();

/**
 * GET /api/v1/scores/distribution
 * Capability #1: Composite Corrix Score Distribution
 */
router.get('/distribution', cacheDistributions, async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate, bucketSize } = req.query;

    const distribution = await scoreService.getScoreDistribution({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      bucketSize: parseInt(bucketSize as string) || 10,
    });

    res.json(distribution);
  } catch (error) {
    console.error('[Scores] Distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch score distribution' });
  }
});

/**
 * GET /api/v1/scores/dimensional-balance
 * Capability #2: Three Rs Dimensional Balance Analysis
 */
router.get('/dimensional-balance', cacheDistributions, async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate } = req.query;

    const balance = await scoreService.getDimensionalBalance({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(balance);
  } catch (error) {
    console.error('[Scores] Dimensional balance error:', error);
    res.status(500).json({ error: 'Failed to fetch dimensional balance' });
  }
});

/**
 * GET /api/v1/scores/breakdown/:dimension
 * Capabilities #3, #4, #5: Dimension Decomposition
 */
router.get('/breakdown/:dimension', cacheDistributions, async (req, res) => {
  try {
    const { dimension } = req.params;
    const { organizationId, teamId, startDate, endDate } = req.query;

    if (!['results', 'relationship', 'resilience'].includes(dimension)) {
      return res.status(400).json({ error: 'Invalid dimension' });
    }

    const breakdown = await scoreService.getDimensionBreakdown({
      dimension: dimension as 'results' | 'relationship' | 'resilience',
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(breakdown);
  } catch (error) {
    console.error('[Scores] Breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch dimension breakdown' });
  }
});

/**
 * GET /api/v1/scores/trends
 * Capability #7: Score Trend Visualization
 */
router.get('/trends', cacheTrends, async (req, res) => {
  try {
    const { organizationId, teamId, metric, period, duration } = req.query;

    const trends = await scoreService.getScoreTrends({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      metric: (metric as string) || 'corrix',
      period: (period as 'day' | 'week' | 'month') || 'day',
      duration: parseInt(duration as string) || 30,
    });

    res.json(trends);
  } catch (error) {
    console.error('[Scores] Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch score trends' });
  }
});

export default router;
