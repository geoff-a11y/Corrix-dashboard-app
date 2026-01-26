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

/**
 * GET /api/v1/scores/time-patterns
 * 3R scores broken down by time of day and day of week
 */
router.get('/time-patterns', cacheDistributions, async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate } = req.query;

    const patterns = await scoreService.getThreeRsTimePatterns({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(patterns);
  } catch (error) {
    console.error('[Scores] Time patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch 3R time patterns' });
  }
});

/**
 * GET /api/v1/scores/domains
 * Get per-domain 3R scores
 */
router.get('/domains', cacheDistributions, async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const domainScores = await scoreService.getDomainScores({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(domainScores);
  } catch (error) {
    console.error('[Scores] Domain scores error:', error);
    res.status(500).json({ error: 'Failed to fetch domain scores' });
  }
});

/**
 * POST /api/v1/scores/domains
 * Submit per-domain 3R scores from extension
 */
router.post('/domains', async (req, res) => {
  try {
    const { userId, organizationId, teamId, date, domains } = req.body;

    if (!userId || !date || !Array.isArray(domains)) {
      return res.status(400).json({ error: 'Missing required fields: userId, date, domains' });
    }

    await scoreService.saveDomainScores({
      userId,
      organizationId,
      teamId,
      date,
      domains,
    });

    res.json({ success: true, domainCount: domains.length });
  } catch (error) {
    console.error('[Scores] Save domain scores error:', error);
    res.status(500).json({ error: 'Failed to save domain scores' });
  }
});

/**
 * GET /api/v1/scores/domain-breakdown
 * Returns 3Rs scores broken down by domain
 */
router.get('/domain-breakdown', cacheDistributions, async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    // Mock data - replace with real implementation when data is available
    const domainBreakdown = {
      domains: [
        {
          domainId: 'engineering',
          domainName: 'Software Engineering',
          results: 78.5,
          relationship: 72.3,
          resilience: 75.8,
          overall: 75.5,
          sessionCount: 145,
          trend: 'improving' as const,
          trendPercentage: 8.2,
        },
        {
          domainId: 'design',
          domainName: 'UI/UX Design',
          results: 82.1,
          relationship: 79.4,
          resilience: 80.2,
          overall: 80.6,
          sessionCount: 98,
          trend: 'stable' as const,
          trendPercentage: 1.3,
        },
        {
          domainId: 'marketing',
          domainName: 'Marketing & Content',
          results: 75.2,
          relationship: 68.9,
          resilience: 71.4,
          overall: 71.8,
          sessionCount: 67,
          trend: 'improving' as const,
          trendPercentage: 5.7,
        },
        {
          domainId: 'data',
          domainName: 'Data Analysis',
          results: 70.4,
          relationship: 65.8,
          resilience: 68.2,
          overall: 68.1,
          sessionCount: 52,
          trend: 'declining' as const,
          trendPercentage: -3.4,
        },
        {
          domainId: 'general',
          domainName: 'General Tasks',
          results: 68.9,
          relationship: 64.2,
          resilience: 66.5,
          overall: 66.5,
          sessionCount: 180,
          trend: 'stable' as const,
          trendPercentage: 0.8,
        },
      ],
      summary: {
        totalDomains: 5,
        totalSessions: 542,
        averageOverall: 72.5,
        topPerformingDomain: 'design',
        needsAttentionDomain: 'data',
        insights: [
          'Design tasks show highest scores across all 3Rs',
          'Data analysis domain declining - consider additional training',
          'General tasks have high volume but lower scores',
        ],
      },
    };

    res.json(domainBreakdown);
  } catch (error) {
    console.error('[Scores] Domain breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch domain breakdown' });
  }
});

export default router;
