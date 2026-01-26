import { Router } from 'express';
import { cacheLists, cacheDistributions } from '../middleware/cache.js';
import db from '../db/connection.js';

const router = Router();

/**
 * Generate anonymized display ID from UUID
 * Format: "User #A1B2" (last 4 chars of UUID uppercased)
 */
function anonymizeUserId(uuid: string): string {
  return `User #${uuid.slice(-4).toUpperCase()}`;
}

/**
 * GET /api/users/list
 * Returns list of users with anonymized display IDs for dropdown selection
 */
router.get('/list', cacheLists, async (req, res) => {
  try {
    const { organizationId, teamId } = req.query;

    let query: string;
    let params: (string | undefined)[];

    if (teamId) {
      // Get users in a specific team
      query = `
        SELECT DISTINCT u.id
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = $1
        ORDER BY u.id
      `;
      params = [teamId as string];
    } else if (organizationId) {
      // Get users in an organization (through teams)
      query = `
        SELECT DISTINCT u.id
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        JOIN teams t ON tm.team_id = t.id
        WHERE t.organization_id = $1
        ORDER BY u.id
      `;
      params = [organizationId as string];
    } else {
      return res.status(400).json({ error: 'organizationId or teamId required' });
    }

    const result = await db.query(query, params);

    const users = result.rows.map(row => ({
      id: row.id,
      displayId: anonymizeUserId(row.id),
    }));

    res.json(users);
  } catch (error) {
    console.error('[Users] List error:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

/**
 * GET /api/users/:userId/summary
 * Returns basic summary stats for a specific user
 */
router.get('/:userId/summary', cacheDistributions, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get latest scores and basic stats
    const result = await db.query(
      `SELECT
        ds.corrix_score,
        ds.results_score,
        ds.relationship_score,
        ds.resilience_score,
        ds.score_date
       FROM daily_scores ds
       WHERE ds.user_id = $1
       ORDER BY ds.score_date DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        userId,
        displayId: anonymizeUserId(userId),
        hasData: false,
      });
    }

    const row = result.rows[0];
    res.json({
      userId,
      displayId: anonymizeUserId(userId),
      hasData: true,
      latestScore: {
        corrixScore: parseFloat(row.corrix_score),
        results: parseFloat(row.results_score),
        relationship: parseFloat(row.relationship_score),
        resilience: parseFloat(row.resilience_score),
        date: row.score_date,
      },
    });
  } catch (error) {
    console.error('[Users] Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch user summary' });
  }
});

/**
 * GET /api/users/:userId/sub-metrics
 * Returns detailed sub-metric breakdown for all three dimensions
 */
router.get('/:userId/sub-metrics', cacheDistributions, async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock data - replace with real implementation when data is available
    const subMetrics = {
      userId,
      displayId: anonymizeUserId(userId),
      results: {
        overall: 75.5,
        subMetrics: {
          outcomeSatisfaction: 78.2,
          editRatio: 72.8,
          taskCompletion: 75.5,
        },
        insights: [
          'High outcome satisfaction indicates good task selection',
          'Edit ratio suggests moderate refinement needed',
        ],
      },
      relationship: {
        overall: 72.3,
        subMetrics: {
          promptQuality: 74.5,
          verificationRate: 68.9,
          dialogueDepth: 73.2,
          criticalEngagement: 72.6,
        },
        insights: [
          'Verification rate below average - encourage more fact-checking',
          'Good dialogue depth showing proper iteration',
        ],
      },
      resilience: {
        overall: 70.8,
        subMetrics: {
          skillTrajectory: 75.3,
          errorRecovery: 68.5,
          adaptation: 68.6,
        },
        insights: [
          'Strong upward trajectory - skills improving over time',
          'Error recovery needs improvement',
        ],
      },
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-25',
      },
    };

    res.json(subMetrics);
  } catch (error) {
    console.error('[Users] Sub-metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch user sub-metrics' });
  }
});

/**
 * GET /api/users/:userId/expertise
 * Returns expertise levels and trajectory across domains
 */
router.get('/:userId/expertise', cacheDistributions, async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock data - replace with real implementation when data is available
    const expertise = {
      userId,
      displayId: anonymizeUserId(userId),
      overallLevel: 'intermediate',
      overallScore: 72.5,
      trajectory: 'improving',
      trajectoryPercentage: 8.5,
      byDomain: [
        {
          domainId: 'engineering',
          domainName: 'Software Engineering',
          level: 'advanced',
          score: 78.5,
          trajectory: 'improving',
          trajectoryPercentage: 12.3,
          sessionCount: 145,
          strengths: ['Code review', 'Debugging', 'Architecture'],
          improvementAreas: ['Testing strategies', 'Performance optimization'],
        },
        {
          domainId: 'design',
          domainName: 'UI/UX Design',
          level: 'intermediate',
          score: 68.2,
          trajectory: 'stable',
          trajectoryPercentage: 1.5,
          sessionCount: 45,
          strengths: ['User research', 'Wireframing'],
          improvementAreas: ['Visual design', 'Interaction patterns'],
        },
        {
          domainId: 'data',
          domainName: 'Data Analysis',
          level: 'novice',
          score: 58.9,
          trajectory: 'improving',
          trajectoryPercentage: 6.8,
          sessionCount: 32,
          strengths: ['Basic queries'],
          improvementAreas: ['Statistical analysis', 'Data visualization', 'Complex joins'],
        },
      ],
      recommendations: [
        'Continue focus on engineering tasks where you excel',
        'Consider structured learning for data analysis fundamentals',
        'Leverage AI for design inspiration but verify outputs carefully',
      ],
      milestones: [
        {
          date: '2024-01-15',
          achievement: 'Reached advanced level in Software Engineering',
          scoreIncrease: 15.2,
        },
        {
          date: '2024-01-08',
          achievement: 'Completed 100 AI-assisted coding sessions',
          scoreIncrease: 8.5,
        },
      ],
    };

    res.json(expertise);
  } catch (error) {
    console.error('[Users] Expertise error:', error);
    res.status(500).json({ error: 'Failed to fetch user expertise' });
  }
});

export default router;
