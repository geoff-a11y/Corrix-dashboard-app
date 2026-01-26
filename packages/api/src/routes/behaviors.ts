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

/**
 * GET /api/behaviors/mode-scores
 * Returns average scores by collaboration mode
 */
router.get('/mode-scores', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    // Mock data - replace with real implementation when data is available
    const modeScores = {
      modes: [
        {
          mode: 'copilot',
          displayName: 'Copilot',
          avgCorrixScore: 72.5,
          avgResults: 75.2,
          avgRelationship: 68.9,
          avgResilience: 73.4,
          sessionCount: 245,
          percentage: 45.2,
        },
        {
          mode: 'coach',
          displayName: 'Coach',
          avgCorrixScore: 78.3,
          avgResults: 80.1,
          avgRelationship: 76.8,
          avgResilience: 78.0,
          sessionCount: 180,
          percentage: 33.2,
        },
        {
          mode: 'consultant',
          displayName: 'Consultant',
          avgCorrixScore: 68.4,
          avgResults: 70.5,
          avgRelationship: 65.2,
          avgResilience: 69.5,
          sessionCount: 85,
          percentage: 15.7,
        },
        {
          mode: 'agent',
          displayName: 'Agent',
          avgCorrixScore: 65.8,
          avgResults: 68.2,
          avgRelationship: 62.5,
          avgResilience: 66.7,
          sessionCount: 32,
          percentage: 5.9,
        },
      ],
      totalSessions: 542,
      insights: [
        'Coach mode shows highest average scores across all dimensions',
        'Copilot mode is most frequently used but has lower relationship scores',
        'Agent mode needs improvement in relationship dimension',
      ],
    };

    res.json(modeScores);
  } catch (error) {
    console.error('[Behaviors] Mode scores error:', error);
    res.status(500).json({ error: 'Failed to fetch collaboration mode scores' });
  }
});

/**
 * GET /api/behaviors/usage-patterns
 * Returns usage pattern data including time-based patterns and critical engagement
 */
router.get('/usage-patterns', async (req, res) => {
  try {
    const { organizationId, teamId, userId, startDate, endDate } = req.query;

    // Mock data - replace with real implementation when data is available
    const usagePatterns = {
      byHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        sessionCount: Math.floor(Math.random() * 50) + 10,
        avgCorrixScore: 60 + Math.random() * 20,
        avgResults: 60 + Math.random() * 20,
        avgRelationship: 60 + Math.random() * 20,
        avgResilience: 60 + Math.random() * 20,
      })),
      byDayPart: {
        morning: { hours: '6am-12pm', sessionCount: 185, avgCorrixScore: 76.2, avgResults: 78.5, avgRelationship: 74.1, avgResilience: 76.0 },
        afternoon: { hours: '12pm-6pm', sessionCount: 245, avgCorrixScore: 72.8, avgResults: 74.3, avgRelationship: 71.5, avgResilience: 72.6 },
        evening: { hours: '6pm-12am', sessionCount: 95, avgCorrixScore: 68.4, avgResults: 70.2, avgRelationship: 66.8, avgResilience: 68.2 },
        night: { hours: '12am-6am', sessionCount: 17, avgCorrixScore: 64.5, avgResults: 66.1, avgRelationship: 62.3, avgResilience: 65.1 },
      },
      peakProductivity: {
        bestHour: 9,
        bestDayPart: 'morning',
        bestDay: 'Tuesday',
        scoreVariation: 12.5,
        recommendation: 'Schedule complex AI tasks requiring verification during morning hours (8am-11am) for optimal performance.',
      },
      criticalEngagement: {
        lowEngagementUsers: [
          { userId: 'user-1', displayId: 'User #A1B2', engagementRate: 8.2, sessionCount: 45, riskLevel: 'high' },
          { userId: 'user-2', displayId: 'User #C3D4', engagementRate: 12.5, sessionCount: 38, riskLevel: 'medium' },
          { userId: 'user-3', displayId: 'User #E5F6', engagementRate: 15.8, sessionCount: 52, riskLevel: 'medium' },
        ],
        averageEngagementRate: 28.4,
        healthyThreshold: 25.0,
        insight: '3 users showing low critical engagement - may indicate over-reliance on AI without verification',
      },
    };

    res.json(usagePatterns);
  } catch (error) {
    console.error('[Behaviors] Usage patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch usage patterns' });
  }
});

export default router;
