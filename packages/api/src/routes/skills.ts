import { Router } from 'express';
import { SkillTrackingService } from '../services/SkillTrackingService.js';
import type { VelocityPeriod, BenchmarkScope } from '@corrix/shared';

const router = Router();
const skillService = new SkillTrackingService();

/**
 * GET /api/skills/trajectory/:userId
 * Capability #21: Skill Trajectory Visualization
 */
router.get('/trajectory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const trajectory = await skillService.getSkillTrajectory({
      userId,
      days: parseInt(days as string) || 90,
    });

    res.json(trajectory);
  } catch (error) {
    console.error('[Skills] Trajectory error:', error);
    res.status(500).json({ error: 'Failed to fetch skill trajectory' });
  }
});

/**
 * GET /api/skills/velocity/leaderboard
 * Capability #22: Learning Velocity Ranking
 */
router.get('/velocity/leaderboard', async (req, res) => {
  try {
    const { organizationId, teamId, roleId, limit, period } = req.query;

    const leaderboard = await skillService.getVelocityLeaderboard({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      roleId: roleId as string | undefined,
      limit: parseInt(limit as string) || 20,
      period: (period as VelocityPeriod) || '30d',
    });

    res.json(leaderboard);
  } catch (error) {
    console.error('[Skills] Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch velocity leaderboard' });
  }
});

/**
 * GET /api/skills/gaps/:userId
 * Capability #23: Skill Gap Analysis
 */
router.get('/gaps/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { benchmarkScope, benchmarkScopeId } = req.query;

    const gaps = await skillService.getSkillGapAnalysis({
      userId,
      benchmarkScope: benchmarkScope as BenchmarkScope | undefined,
      benchmarkScopeId: benchmarkScopeId as string | undefined,
    });

    res.json(gaps);
  } catch (error) {
    console.error('[Skills] Gaps error:', error);
    res.status(500).json({ error: 'Failed to fetch skill gap analysis' });
  }
});

/**
 * GET /api/skills/time-to-competency
 * Capability #26: Time-to-Competency Metrics
 */
router.get('/time-to-competency', async (req, res) => {
  try {
    const { organizationId, teamId, roleId, cohortStart, cohortEnd } = req.query;

    const metrics = await skillService.getTimeToCompetencyMetrics({
      organizationId: organizationId as string,
      teamId: teamId as string | undefined,
      roleId: roleId as string | undefined,
      cohortStart: cohortStart as string | undefined,
      cohortEnd: cohortEnd as string | undefined,
    });

    res.json(metrics);
  } catch (error) {
    console.error('[Skills] Time-to-competency error:', error);
    res.status(500).json({ error: 'Failed to fetch time-to-competency metrics' });
  }
});

/**
 * GET /api/skills/milestones/:userId
 *
 * Get competency milestones for a user
 */
router.get('/milestones/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const milestones = await skillService.getUserMilestones(userId);

    res.json(milestones);
  } catch (error) {
    console.error('[Skills] Milestones error:', error);
    res.status(500).json({ error: 'Failed to fetch user milestones' });
  }
});

export default router;
