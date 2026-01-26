import { Router } from 'express';
import { PerformanceService } from '../services/PerformanceService.js';

const router = Router();
const performanceService = new PerformanceService();

/**
 * GET /api/performance/baseline-comparison
 * Get baseline vs current score comparison
 * Query params:
 *   - scope: 'organization' | 'team' | 'individual'
 *   - entityId: ID of the organization, team, or user
 */
router.get('/baseline-comparison', async (req, res) => {
  try {
    const { scope, entityId } = req.query;

    if (!scope || !entityId) {
      return res.status(400).json({ error: 'scope and entityId are required' });
    }

    if (scope !== 'organization' && scope !== 'team' && scope !== 'individual') {
      return res.status(400).json({ error: 'scope must be organization, team, or individual' });
    }

    const comparison = await performanceService.getBaselineComparison(
      scope as 'organization' | 'team' | 'individual',
      entityId as string
    );

    if (!comparison) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json(comparison);
  } catch (error) {
    console.error('[Performance] Error fetching baseline comparison:', error);
    res.status(500).json({ error: 'Failed to fetch baseline comparison' });
  }
});

/**
 * GET /api/performance/score-drivers
 * Analyze what factors contribute to the score
 * Query params:
 *   - scope: 'organization' | 'team' | 'individual'
 *   - entityId: ID of the organization, team, or user
 */
router.get('/score-drivers', async (req, res) => {
  try {
    const { scope, entityId } = req.query;

    if (!scope || !entityId) {
      return res.status(400).json({ error: 'scope and entityId are required' });
    }

    if (scope !== 'organization' && scope !== 'team' && scope !== 'individual') {
      return res.status(400).json({ error: 'scope must be organization, team, or individual' });
    }

    const drivers = await performanceService.getScoreDrivers(
      scope as 'organization' | 'team' | 'individual',
      entityId as string
    );

    res.json(drivers);
  } catch (error) {
    console.error('[Performance] Error fetching score drivers:', error);
    res.status(500).json({ error: 'Failed to fetch score drivers' });
  }
});

/**
 * GET /api/performance/baseline
 * Returns baseline comparison data with trend analysis
 * Query params:
 *   - scope: 'organization' | 'team' | 'individual'
 *   - entityId: ID of the organization, team, or user
 */
router.get('/baseline', async (req, res) => {
  try {
    const { scope, entityId } = req.query;

    if (!scope || !entityId) {
      return res.status(400).json({ error: 'scope and entityId are required' });
    }

    if (scope !== 'organization' && scope !== 'team' && scope !== 'individual') {
      return res.status(400).json({ error: 'scope must be organization, team, or individual' });
    }

    // Mock data - replace with real implementation when data is available
    const baselineData = {
      scope: scope as string,
      entityId: entityId as string,
      current: {
        corrixScore: 72.5,
        results: 75.2,
        relationship: 68.9,
        resilience: 73.4,
        periodStart: '2024-01-18',
        periodEnd: '2024-01-25',
      },
      baseline: {
        corrixScore: 65.8,
        results: 68.2,
        relationship: 62.5,
        resilience: 66.7,
        periodStart: '2023-12-01',
        periodEnd: '2023-12-31',
      },
      changes: {
        corrixScore: { absolute: 6.7, percentage: 10.2, trend: 'up' as const },
        results: { absolute: 7.0, percentage: 10.3, trend: 'up' as const },
        relationship: { absolute: 6.4, percentage: 10.2, trend: 'up' as const },
        resilience: { absolute: 6.7, percentage: 10.0, trend: 'up' as const },
      },
      historicalTrend: [
        { date: '2023-12-01', score: 65.8 },
        { date: '2023-12-15', score: 67.2 },
        { date: '2024-01-01', score: 68.9 },
        { date: '2024-01-15', score: 71.3 },
        { date: '2024-01-25', score: 72.5 },
      ],
      insights: [
        'Consistent upward trend across all dimensions',
        'Relationship dimension showing strongest improvement',
        'On track to reach 75+ Corrix score by February',
      ],
      milestones: [
        {
          date: '2024-01-20',
          achievement: 'Crossed 70 Corrix score threshold',
          impact: 'high' as const,
        },
        {
          date: '2024-01-10',
          achievement: 'Verification rate improved by 15%',
          impact: 'medium' as const,
        },
      ],
    };

    res.json(baselineData);
  } catch (error) {
    console.error('[Performance] Error fetching baseline data:', error);
    res.status(500).json({ error: 'Failed to fetch baseline data' });
  }
});

export default router;
