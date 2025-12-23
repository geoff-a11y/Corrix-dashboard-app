import { Router } from 'express';
import { CoachingAnalyticsService } from '../services/CoachingAnalyticsService.js';
import type { AdvancedCoachingType } from '@corrix/shared';

const router = Router();
const coachingService = new CoachingAnalyticsService();

/**
 * GET /api/v1/coaching/analytics
 * Get comprehensive coaching analytics with summary, by-type, matrix, and recommendations
 */
router.get('/analytics', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate, coachingTypes } = req.query;

    const analytics = await coachingService.getCoachingAnalytics({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      coachingTypes: coachingTypes
        ? (coachingTypes as string).split(',') as AdvancedCoachingType[]
        : undefined,
    });

    res.json(analytics);
  } catch (error) {
    console.error('[Coaching] Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch coaching analytics' });
  }
});

/**
 * GET /api/v1/coaching/summary
 * Get coaching effectiveness summary
 */
router.get('/summary', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const summary = await coachingService.getSummary({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(summary);
  } catch (error) {
    console.error('[Coaching] Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch coaching summary' });
  }
});

/**
 * GET /api/v1/coaching/by-type
 * Get effectiveness analytics broken down by coaching type
 */
router.get('/by-type', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate, coachingTypes } = req.query;

    const byType = await coachingService.getByType({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      coachingTypes: coachingTypes
        ? (coachingTypes as string).split(',') as AdvancedCoachingType[]
        : undefined,
    });

    res.json(byType);
  } catch (error) {
    console.error('[Coaching] By-type error:', error);
    res.status(500).json({ error: 'Failed to fetch coaching by type' });
  }
});

/**
 * GET /api/v1/coaching/matrix
 * Get effectiveness matrix (coaching type × expertise level)
 */
router.get('/matrix', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const matrix = await coachingService.getEffectivenessMatrix({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(matrix);
  } catch (error) {
    console.error('[Coaching] Matrix error:', error);
    res.status(500).json({ error: 'Failed to fetch effectiveness matrix' });
  }
});

/**
 * GET /api/v1/coaching/recommendations
 * Get auto-generated recommendations for coaching tip adjustments
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const recommendations = await coachingService.getRecommendations({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(recommendations);
  } catch (error) {
    console.error('[Coaching] Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

/**
 * GET /api/v1/coaching/type/:type
 * Get detailed analytics for a specific coaching type
 */
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const byType = await coachingService.getByType({
      organizationId: organizationId as string | undefined,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      coachingTypes: [type as AdvancedCoachingType],
    });

    if (byType.length === 0) {
      return res.status(404).json({ error: 'Coaching type not found' });
    }

    res.json(byType[0]);
  } catch (error) {
    console.error('[Coaching] Type detail error:', error);
    res.status(500).json({ error: 'Failed to fetch coaching type details' });
  }
});

export default router;
