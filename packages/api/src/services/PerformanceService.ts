import db from '../db/connection.js';
import { getSupabaseClient } from '../cloud/supabase.js';
import type { BaselineComparisonResponse, ScoreDriver, ScoreDriversResponse } from '@corrix/shared';

export class PerformanceService {
  /**
   * Get baseline comparison for organization, team, or individual
   * Queries alpha_users table for baseline, daily_scores for current
   */
  async getBaselineComparison(
    scope: 'organization' | 'team' | 'individual',
    entityId: string
  ): Promise<BaselineComparisonResponse | null> {
    const supabase = getSupabaseClient();

    if (scope === 'individual') {
      return this.getIndividualBaseline(entityId, supabase);
    } else if (scope === 'team') {
      return this.getTeamBaseline(entityId, supabase);
    } else {
      return this.getOrganizationBaseline(entityId, supabase);
    }
  }

  /**
   * Get baseline for an individual user
   */
  private async getIndividualBaseline(
    entityId: string,
    supabase: any
  ): Promise<BaselineComparisonResponse | null> {
    // First, get the user from our database
    const userQuery = await db.query(
      'SELECT id, anonymous_id, email FROM users WHERE id = $1 OR email = $2',
      [entityId, entityId]
    );

    if (userQuery.rows.length === 0) {
      return null;
    }

    const user = userQuery.rows[0];
    const userId = user.id;
    const userIdentifier = user.email || user.anonymous_id;

    // Get baseline from alpha_users (if available via Supabase)
    let baselineData = null;
    let baselineCapturedAt = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('alpha_users')
          .select('baseline_corrix_score, baseline_results_score, baseline_relationship_score, baseline_resilience_score, baseline_synced_at, baseline_completed')
          .or(`email.eq.${userIdentifier},user_id.eq.${entityId}`)
          .eq('baseline_completed', true)
          .single();

        if (!error && data) {
          baselineData = {
            corrixScore: data.baseline_corrix_score || 0,
            results: data.baseline_results_score || 0,
            relationship: data.baseline_relationship_score || 0,
            resilience: data.baseline_resilience_score || 0,
          };
          baselineCapturedAt = data.baseline_synced_at;
        }
      } catch (error) {
        console.error('[PerformanceService] Error fetching individual baseline:', error);
      }
    }

    // Get current scores from daily_scores
    const currentQuery = await db.query(
      `SELECT
        COALESCE(AVG(corrix_score), 0) as corrix_score,
        COALESCE(AVG(results_score), 0) as results_score,
        COALESCE(AVG(relationship_score), 0) as relationship_score,
        COALESCE(AVG(resilience_score), 0) as resilience_score,
        MAX(date) as max_date
      FROM daily_scores
      WHERE user_id = $1
        AND date >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    const currentData = currentQuery.rows[0];

    const hasBaseline = baselineData !== null;
    const baseline = baselineData || {
      corrixScore: 0,
      results: 0,
      relationship: 0,
      resilience: 0,
    };

    const current = {
      corrixScore: parseFloat(currentData.corrix_score),
      results: parseFloat(currentData.results_score),
      relationship: parseFloat(currentData.relationship_score),
      resilience: parseFloat(currentData.resilience_score),
      asOf: currentData.max_date || new Date().toISOString().split('T')[0],
    };

    const change = {
      corrixScore: current.corrixScore - baseline.corrixScore,
      results: current.results - baseline.results,
      relationship: current.relationship - baseline.relationship,
      resilience: current.resilience - baseline.resilience,
      percentageChange: baseline.corrixScore > 0
        ? ((current.corrixScore - baseline.corrixScore) / baseline.corrixScore) * 100
        : 0,
    };

    return {
      scope: 'individual',
      entityId: userId,
      entityName: userIdentifier,
      baseline: {
        ...baseline,
        capturedAt: baselineCapturedAt,
      },
      current,
      change,
      hasBaseline,
    };
  }

  /**
   * Get baseline for a team (averaged across users)
   */
  private async getTeamBaseline(
    teamId: string,
    supabase: any
  ): Promise<BaselineComparisonResponse | null> {
    // Get team info
    const teamQuery = await db.query(
      'SELECT id, name, organization_id FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamQuery.rows.length === 0) {
      return null;
    }

    const team = teamQuery.rows[0];

    // Get all users in the team
    const usersQuery = await db.query(
      'SELECT id, anonymous_id, email FROM users WHERE team_id = $1',
      [teamId]
    );

    if (usersQuery.rows.length === 0) {
      return null;
    }

    // Get baseline from alpha_users (if available)
    let baselineScores = { corrixScore: 0, results: 0, relationship: 0, resilience: 0 };
    let baselineCapturedAt = null;
    let baselineCount = 0;

    if (supabase) {
      try {
        const emails = usersQuery.rows.map(u => u.email).filter(Boolean);
        if (emails.length > 0) {
          const { data, error } = await supabase
            .from('alpha_users')
            .select('baseline_corrix_score, baseline_results_score, baseline_relationship_score, baseline_resilience_score, baseline_synced_at')
            .in('email', emails)
            .eq('baseline_completed', true);

          if (!error && data && data.length > 0) {
            interface BaselineRow {
              baseline_corrix_score?: number;
              baseline_results_score?: number;
              baseline_relationship_score?: number;
              baseline_resilience_score?: number;
              baseline_synced_at?: string;
            }
            const sum = data.reduce((acc: { corrixScore: number; results: number; relationship: number; resilience: number }, row: BaselineRow) => ({
              corrixScore: acc.corrixScore + (row.baseline_corrix_score || 0),
              results: acc.results + (row.baseline_results_score || 0),
              relationship: acc.relationship + (row.baseline_relationship_score || 0),
              resilience: acc.resilience + (row.baseline_resilience_score || 0),
            }), { corrixScore: 0, results: 0, relationship: 0, resilience: 0 });

            baselineCount = data.length;
            baselineScores = {
              corrixScore: sum.corrixScore / baselineCount,
              results: sum.results / baselineCount,
              relationship: sum.relationship / baselineCount,
              resilience: sum.resilience / baselineCount,
            };
            baselineCapturedAt = data[0].baseline_synced_at;
          }
        }
      } catch (error) {
        console.error('[PerformanceService] Error fetching team baseline:', error);
      }
    }

    // Get current scores
    const currentQuery = await db.query(
      `SELECT
        COALESCE(AVG(ds.corrix_score), 0) as corrix_score,
        COALESCE(AVG(ds.results_score), 0) as results_score,
        COALESCE(AVG(ds.relationship_score), 0) as relationship_score,
        COALESCE(AVG(ds.resilience_score), 0) as resilience_score,
        MAX(ds.date) as max_date
      FROM users u
      JOIN daily_scores ds ON ds.user_id = u.id
      WHERE u.team_id = $1
        AND ds.date >= NOW() - INTERVAL '7 days'`,
      [teamId]
    );

    const currentData = currentQuery.rows[0];

    const current = {
      corrixScore: parseFloat(currentData.corrix_score),
      results: parseFloat(currentData.results_score),
      relationship: parseFloat(currentData.relationship_score),
      resilience: parseFloat(currentData.resilience_score),
      asOf: currentData.max_date || new Date().toISOString().split('T')[0],
    };

    const change = {
      corrixScore: current.corrixScore - baselineScores.corrixScore,
      results: current.results - baselineScores.results,
      relationship: current.relationship - baselineScores.relationship,
      resilience: current.resilience - baselineScores.resilience,
      percentageChange: baselineScores.corrixScore > 0
        ? ((current.corrixScore - baselineScores.corrixScore) / baselineScores.corrixScore) * 100
        : 0,
    };

    return {
      scope: 'team',
      entityId: teamId,
      entityName: team.name,
      baseline: {
        ...baselineScores,
        capturedAt: baselineCapturedAt,
      },
      current,
      change,
      hasBaseline: baselineCount > 0,
    };
  }

  /**
   * Get baseline for an organization (averaged across all users)
   */
  private async getOrganizationBaseline(
    organizationId: string,
    supabase: any
  ): Promise<BaselineComparisonResponse | null> {
    // Get organization info
    const orgQuery = await db.query(
      'SELECT id, name FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (orgQuery.rows.length === 0) {
      return null;
    }

    const org = orgQuery.rows[0];

    // Get all users in the organization
    const usersQuery = await db.query(
      'SELECT id, anonymous_id, email FROM users WHERE organization_id = $1',
      [organizationId]
    );

    if (usersQuery.rows.length === 0) {
      return null;
    }

    // Get baseline from alpha_users
    let baselineScores = { corrixScore: 0, results: 0, relationship: 0, resilience: 0 };
    let baselineCapturedAt = null;
    let baselineCount = 0;

    if (supabase) {
      try {
        const emails = usersQuery.rows.map(u => u.email).filter(Boolean);
        if (emails.length > 0) {
          const { data, error } = await supabase
            .from('alpha_users')
            .select('baseline_corrix_score, baseline_results_score, baseline_relationship_score, baseline_resilience_score, baseline_synced_at')
            .in('email', emails)
            .eq('baseline_completed', true);

          if (!error && data && data.length > 0) {
            interface BaselineRowOrg {
              baseline_corrix_score?: number;
              baseline_results_score?: number;
              baseline_relationship_score?: number;
              baseline_resilience_score?: number;
              baseline_synced_at?: string;
            }
            const sum = data.reduce((acc: { corrixScore: number; results: number; relationship: number; resilience: number }, row: BaselineRowOrg) => ({
              corrixScore: acc.corrixScore + (row.baseline_corrix_score || 0),
              results: acc.results + (row.baseline_results_score || 0),
              relationship: acc.relationship + (row.baseline_relationship_score || 0),
              resilience: acc.resilience + (row.baseline_resilience_score || 0),
            }), { corrixScore: 0, results: 0, relationship: 0, resilience: 0 });

            baselineCount = data.length;
            baselineScores = {
              corrixScore: sum.corrixScore / baselineCount,
              results: sum.results / baselineCount,
              relationship: sum.relationship / baselineCount,
              resilience: sum.resilience / baselineCount,
            };
            baselineCapturedAt = data[0].baseline_synced_at;
          }
        }
      } catch (error) {
        console.error('[PerformanceService] Error fetching organization baseline:', error);
      }
    }

    // Get current scores
    const currentQuery = await db.query(
      `SELECT
        COALESCE(AVG(ds.corrix_score), 0) as corrix_score,
        COALESCE(AVG(ds.results_score), 0) as results_score,
        COALESCE(AVG(ds.relationship_score), 0) as relationship_score,
        COALESCE(AVG(ds.resilience_score), 0) as resilience_score,
        MAX(ds.date) as max_date
      FROM users u
      JOIN daily_scores ds ON ds.user_id = u.id
      WHERE u.organization_id = $1
        AND ds.date >= NOW() - INTERVAL '7 days'`,
      [organizationId]
    );

    const currentData = currentQuery.rows[0];

    const current = {
      corrixScore: parseFloat(currentData.corrix_score),
      results: parseFloat(currentData.results_score),
      relationship: parseFloat(currentData.relationship_score),
      resilience: parseFloat(currentData.resilience_score),
      asOf: currentData.max_date || new Date().toISOString().split('T')[0],
    };

    const change = {
      corrixScore: current.corrixScore - baselineScores.corrixScore,
      results: current.results - baselineScores.results,
      relationship: current.relationship - baselineScores.relationship,
      resilience: current.resilience - baselineScores.resilience,
      percentageChange: baselineScores.corrixScore > 0
        ? ((current.corrixScore - baselineScores.corrixScore) / baselineScores.corrixScore) * 100
        : 0,
    };

    return {
      scope: 'organization',
      entityId: organizationId,
      entityName: org.name,
      baseline: {
        ...baselineScores,
        capturedAt: baselineCapturedAt,
      },
      current,
      change,
      hasBaseline: baselineCount > 0,
    };
  }

  /**
   * Analyze what factors contribute to the score
   * This is a simplified implementation that looks at the 3Rs
   */
  async getScoreDrivers(
    scope: 'organization' | 'team' | 'individual',
    entityId: string
  ): Promise<ScoreDriversResponse> {
    let query: string;
    const params: string[] = [entityId];

    if (scope === 'individual') {
      query = `
        SELECT
          COALESCE(AVG(corrix_score), 0) as corrix_score,
          COALESCE(AVG(results_score), 0) as results_score,
          COALESCE(AVG(relationship_score), 0) as relationship_score,
          COALESCE(AVG(resilience_score), 0) as resilience_score
        FROM daily_scores
        WHERE user_id = $1
          AND date >= NOW() - INTERVAL '7 days'
      `;
    } else if (scope === 'team') {
      query = `
        SELECT
          COALESCE(AVG(ds.corrix_score), 0) as corrix_score,
          COALESCE(AVG(ds.results_score), 0) as results_score,
          COALESCE(AVG(ds.relationship_score), 0) as relationship_score,
          COALESCE(AVG(ds.resilience_score), 0) as resilience_score
        FROM users u
        JOIN daily_scores ds ON ds.user_id = u.id
        WHERE u.team_id = $1
          AND ds.date >= NOW() - INTERVAL '7 days'
      `;
    } else {
      query = `
        SELECT
          COALESCE(AVG(ds.corrix_score), 0) as corrix_score,
          COALESCE(AVG(ds.results_score), 0) as results_score,
          COALESCE(AVG(ds.relationship_score), 0) as relationship_score,
          COALESCE(AVG(ds.resilience_score), 0) as resilience_score
        FROM users u
        JOIN daily_scores ds ON ds.user_id = u.id
        WHERE u.organization_id = $1
          AND ds.date >= NOW() - INTERVAL '7 days'
      `;
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return {
        drivers: [],
        topPositive: [],
        topNegative: [],
      };
    }

    const scores = result.rows[0];
    const avgScore = parseFloat(scores.corrix_score);

    // Calculate impact of each R
    const resultsImpact = parseFloat(scores.results_score) - avgScore;
    const relationshipImpact = parseFloat(scores.relationship_score) - avgScore;
    const resilienceImpact = parseFloat(scores.resilience_score) - avgScore;

    const drivers: ScoreDriver[] = [
      {
        factor: 'Results',
        impact: Math.abs(resultsImpact),
        direction: resultsImpact >= 0 ? 'positive' : 'negative',
        description: `Results score is ${parseFloat(scores.results_score).toFixed(1)}, ${resultsImpact >= 0 ? 'boosting' : 'lowering'} overall performance.`,
        recommendation: resultsImpact < 0
          ? 'Focus on output quality and task completion. Consider breaking down larger goals into achievable milestones.'
          : 'Continue maintaining strong results-oriented practices.',
      },
      {
        factor: 'Relationship',
        impact: Math.abs(relationshipImpact),
        direction: relationshipImpact >= 0 ? 'positive' : 'negative',
        description: `Relationship score is ${parseFloat(scores.relationship_score).toFixed(1)}, ${relationshipImpact >= 0 ? 'boosting' : 'lowering'} overall performance.`,
        recommendation: relationshipImpact < 0
          ? 'Invest in collaboration and communication. Schedule regular check-ins and team activities.'
          : 'Keep fostering strong team relationships and collaboration.',
      },
      {
        factor: 'Resilience',
        impact: Math.abs(resilienceImpact),
        direction: resilienceImpact >= 0 ? 'positive' : 'negative',
        description: `Resilience score is ${parseFloat(scores.resilience_score).toFixed(1)}, ${resilienceImpact >= 0 ? 'boosting' : 'lowering'} overall performance.`,
        recommendation: resilienceImpact < 0
          ? 'Build resilience through stress management and adaptive practices. Encourage breaks and flexible work approaches.'
          : 'Maintain healthy resilience practices and stress management.',
      },
    ];

    // Sort by impact to get top positive and negative
    const sortedByImpact = [...drivers].sort((a, b) => b.impact - a.impact);
    const topPositive = sortedByImpact.filter(d => d.direction === 'positive').slice(0, 3);
    const topNegative = sortedByImpact.filter(d => d.direction === 'negative').slice(0, 3);

    return {
      drivers,
      topPositive,
      topNegative,
    };
  }
}
