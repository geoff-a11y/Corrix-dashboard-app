import { Router } from 'express';
import { BehaviorAnalyticsService } from '../services/BehaviorAnalyticsService.js';
import { DeepBehaviorAnalyticsService } from '../services/DeepBehaviorAnalyticsService.js';

const router = Router();
const behaviorService = new BehaviorAnalyticsService();
const deepBehaviorService = new DeepBehaviorAnalyticsService();

/**
 * GET /api/v1/behaviors/prompt-quality
 * Capability #11: Prompt Quality Distribution
 */
router.get('/prompt-quality', async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate } = req.query;

    const distribution = await behaviorService.getPromptQualityDistribution({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(distribution);
  } catch (error) {
    console.error('[Behaviors] Prompt quality error:', error);
    res.status(500).json({ error: 'Failed to fetch prompt quality distribution' });
  }
});

/**
 * GET /api/v1/behaviors/actions
 * Capability #16: Action Type Distribution
 */
router.get('/actions', async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate } = req.query;

    const actions = await behaviorService.getActionDistribution({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(actions);
  } catch (error) {
    console.error('[Behaviors] Actions error:', error);
    res.status(500).json({ error: 'Failed to fetch action distribution' });
  }
});

/**
 * GET /api/v1/behaviors/sessions
 * Capability #18: Session Duration Analytics
 */
router.get('/sessions', async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate } = req.query;

    const sessions = await behaviorService.getSessionAnalytics({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(sessions);
  } catch (error) {
    console.error('[Behaviors] Sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch session analytics' });
  }
});

/**
 * GET /api/v1/behaviors/platforms
 * Capability #19: Platform Preference Analysis
 */
router.get('/platforms', async (req, res) => {
  try {
    const { organizationId, teamId, startDate, endDate } = req.query;

    const platforms = await behaviorService.getPlatformAnalytics({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(platforms);
  } catch (error) {
    console.error('[Behaviors] Platforms error:', error);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
});

// ============================================================
// Phase 2: Deep Behavior Analytics (Capabilities #12-17, #20)
// ============================================================

/**
 * GET /api/behaviors/verification
 * Capability #12: Verification Behavior Rates
 */
router.get('/verification', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const analysis = await deepBehaviorService.getVerificationAnalysis({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analysis);
  } catch (error) {
    console.error('[Behaviors] Verification error:', error);
    res.status(500).json({ error: 'Failed to fetch verification analysis' });
  }
});

/**
 * GET /api/behaviors/edit-ratio
 * Capability #13: Edit Ratio Tracking
 */
router.get('/edit-ratio', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const analysis = await deepBehaviorService.getEditRatioAnalysis({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analysis);
  } catch (error) {
    console.error('[Behaviors] Edit ratio error:', error);
    res.status(500).json({ error: 'Failed to fetch edit ratio analysis' });
  }
});

/**
 * GET /api/behaviors/dialogue-depth
 * Capability #14: Dialogue Depth Distribution
 */
router.get('/dialogue-depth', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const analysis = await deepBehaviorService.getDialogueDepthAnalysis({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analysis);
  } catch (error) {
    console.error('[Behaviors] Dialogue depth error:', error);
    res.status(500).json({ error: 'Failed to fetch dialogue depth analysis' });
  }
});

/**
 * GET /api/behaviors/time-to-action
 * Capability #15: Time-to-Action Patterns
 */
router.get('/time-to-action', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const analysis = await deepBehaviorService.getTimeToActionAnalysis({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analysis);
  } catch (error) {
    console.error('[Behaviors] Time to action error:', error);
    res.status(500).json({ error: 'Failed to fetch time-to-action analysis' });
  }
});

/**
 * GET /api/behaviors/critical-engagement
 * Capability #17: Critical Engagement Signals
 */
router.get('/critical-engagement', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const analysis = await deepBehaviorService.getCriticalEngagementAnalysis({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analysis);
  } catch (error) {
    console.error('[Behaviors] Critical engagement error:', error);
    res.status(500).json({ error: 'Failed to fetch critical engagement analysis' });
  }
});

/**
 * GET /api/behaviors/feedback-quality
 * Capability #20: Feedback Quality Metrics
 */
router.get('/feedback-quality', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const analysis = await deepBehaviorService.getFeedbackQualityAnalysis({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analysis);
  } catch (error) {
    console.error('[Behaviors] Feedback quality error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback quality analysis' });
  }
});

/**
 * GET /api/behaviors/collaboration-modes
 * Collaboration mode distribution and average scores
 */
router.get('/collaboration-modes', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const modes = await behaviorService.getCollaborationModeAnalytics({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(modes);
  } catch (error) {
    console.error('[Behaviors] Collaboration modes error:', error);
    res.status(500).json({ error: 'Failed to fetch collaboration mode analytics' });
  }
});

/**
 * GET /api/behaviors/deep-summary
 * Combined deep behavior analysis
 */
router.get('/deep-summary', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    const summary = await deepBehaviorService.getDeepBehaviorSummary({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      userId: userId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(summary);
  } catch (error) {
    console.error('[Behaviors] Deep summary error:', error);
    res.status(500).json({ error: 'Failed to fetch deep behavior summary' });
  }
});

export default router;
