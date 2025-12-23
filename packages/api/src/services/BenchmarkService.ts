import db from '../db/connection.js';
import type {
  Benchmark,
  DepartmentAnalytics,
  RoleAnalytics,
  DepartmentComparison,
  DepartmentSummary,
  RoleSummary,
  UserMetadata,
  BenchmarkScope,
  RoleCategory,
  SeniorityLevel,
} from '@corrix/shared';

export class BenchmarkService {

  /**
   * Get department comparison
   * Capability #35
   */
  async getDepartmentComparison(params: {
    organizationId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DepartmentComparison> {
    const { organizationId, startDate, endDate } = params;

    const dateConditions: string[] = [];
    const queryParams: string[] = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      dateConditions.push(`ds.date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      dateConditions.push(`ds.date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    const dateFilter = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

    const query = `
      WITH dept_scores AS (
        SELECT
          d.id as department_id,
          d.name as department_name,
          pd.name as parent_department_name,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN ds.date >= CURRENT_DATE - INTERVAL '30 days' THEN u.id END) as active_users,
          AVG(ds.corrix_score) as avg_corrix,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.corrix_score) as median_corrix,
          AVG(ds.results_score) as avg_results,
          AVG(ds.relationship_score) as avg_relationship,
          AVG(ds.resilience_score) as avg_resilience,
          -- Trend calculation
          AVG(ds.corrix_score) FILTER (WHERE ds.date >= CURRENT_DATE - INTERVAL '14 days') as recent_avg,
          AVG(ds.corrix_score) FILTER (WHERE ds.date >= CURRENT_DATE - INTERVAL '28 days' AND ds.date < CURRENT_DATE - INTERVAL '14 days') as previous_avg
        FROM departments d
        LEFT JOIN departments pd ON d.parent_department_id = pd.id
        LEFT JOIN user_metadata um ON um.department_id = d.id
        LEFT JOIN users u ON um.user_id = u.id AND u.organization_id = $1
        LEFT JOIN daily_scores ds ON u.id = ds.user_id ${dateFilter}
        WHERE d.organization_id = $1
        GROUP BY d.id, d.name, pd.name
      ),
      org_avg AS (
        SELECT AVG(corrix_score) as org_avg_score
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        WHERE u.organization_id = $1 ${dateFilter}
      )
      SELECT
        ds.*,
        oa.org_avg_score,
        PERCENT_RANK() OVER (ORDER BY ds.avg_corrix) * 100 as percentile_in_org
      FROM dept_scores ds, org_avg oa
      ORDER BY ds.avg_corrix DESC
    `;

    const result = await db.query(query, queryParams);

    const departments: DepartmentAnalytics[] = result.rows.map(row => {
      const recentAvg = parseFloat(row.recent_avg || 0);
      const previousAvg = parseFloat(row.previous_avg || 0);
      const trend = recentAvg > previousAvg + 2 ? 'up' : recentAvg < previousAvg - 2 ? 'down' : 'stable';

      return {
        departmentId: row.department_id,
        departmentName: row.department_name,
        parentDepartmentName: row.parent_department_name,
        totalUsers: parseInt(row.total_users || 0),
        activeUsers: parseInt(row.active_users || 0),
        scores: {
          corrixScore: {
            mean: parseFloat(row.avg_corrix || 0),
            median: parseFloat(row.median_corrix || 0),
            trend,
          },
          results: { mean: parseFloat(row.avg_results || 0), median: 0 },
          relationship: { mean: parseFloat(row.avg_relationship || 0), median: 0 },
          resilience: { mean: parseFloat(row.avg_resilience || 0), median: 0 },
        },
        vsOrganization: {
          corrixScoreDiff: parseFloat(row.avg_corrix || 0) - parseFloat(row.org_avg_score || 0),
          percentileInOrg: parseFloat(row.percentile_in_org || 0),
        },
        topPerformers: [],
        skillDistribution: {
          belowBaseline: 0,
          baseline: 0,
          competent: 0,
          proficient: 0,
          expert: 0,
        },
      };
    });

    // Build ranking
    const ranking = departments.map((dept, index) => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      rank: index + 1,
      score: dept.scores.corrixScore.mean,
      trend: dept.scores.corrixScore.trend,
    }));

    // Find highlights
    const sorted = [...departments].sort((a, b) => b.scores.corrixScore.mean - a.scores.corrixScore.mean);
    const topPerforming = sorted[0] || departments[0];
    const mostImproved = [...departments]
      .filter(d => d.scores.corrixScore.trend === 'up')
      .sort((a, b) => b.vsOrganization.corrixScoreDiff - a.vsOrganization.corrixScoreDiff)[0] || topPerforming;
    const needsAttention = departments.filter(
      d => d.scores.corrixScore.mean < 50 || d.scores.corrixScore.trend === 'down'
    );

    return {
      departments,
      ranking,
      topPerforming,
      mostImproved,
      needsAttention,
    };
  }

  /**
   * Get detailed department analytics
   */
  async getDepartmentAnalytics(params: {
    departmentId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DepartmentAnalytics> {
    const { departmentId, startDate, endDate } = params;

    const dateConditions: string[] = [];
    const queryParams: string[] = [departmentId];
    let paramIndex = 2;

    if (startDate) {
      dateConditions.push(`ds.date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      dateConditions.push(`ds.date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    const dateFilter = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

    const query = `
      WITH dept_info AS (
        SELECT d.id, d.name, d.organization_id, pd.name as parent_name
        FROM departments d
        LEFT JOIN departments pd ON d.parent_department_id = pd.id
        WHERE d.id = $1
      ),
      dept_scores AS (
        SELECT
          AVG(ds.corrix_score) as avg_corrix,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.corrix_score) as median_corrix,
          AVG(ds.results_score) as avg_results,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.results_score) as median_results,
          AVG(ds.relationship_score) as avg_relationship,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.relationship_score) as median_relationship,
          AVG(ds.resilience_score) as avg_resilience,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.resilience_score) as median_resilience,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN ds.date >= CURRENT_DATE - INTERVAL '30 days' THEN u.id END) as active_users,
          AVG(ds.corrix_score) FILTER (WHERE ds.date >= CURRENT_DATE - INTERVAL '14 days') as recent_avg,
          AVG(ds.corrix_score) FILTER (WHERE ds.date >= CURRENT_DATE - INTERVAL '28 days' AND ds.date < CURRENT_DATE - INTERVAL '14 days') as previous_avg
        FROM user_metadata um
        JOIN users u ON um.user_id = u.id
        JOIN daily_scores ds ON u.id = ds.user_id ${dateFilter}
        WHERE um.department_id = $1
      ),
      skill_dist AS (
        SELECT
          COUNT(*) FILTER (WHERE ss.overall_skill_score < 50) * 100.0 / NULLIF(COUNT(*), 0) as below_baseline,
          COUNT(*) FILTER (WHERE ss.overall_skill_score >= 50 AND ss.overall_skill_score < 70) * 100.0 / NULLIF(COUNT(*), 0) as baseline,
          COUNT(*) FILTER (WHERE ss.overall_skill_score >= 70 AND ss.overall_skill_score < 85) * 100.0 / NULLIF(COUNT(*), 0) as competent,
          COUNT(*) FILTER (WHERE ss.overall_skill_score >= 85 AND ss.overall_skill_score < 95) * 100.0 / NULLIF(COUNT(*), 0) as proficient,
          COUNT(*) FILTER (WHERE ss.overall_skill_score >= 95) * 100.0 / NULLIF(COUNT(*), 0) as expert
        FROM user_metadata um
        JOIN skill_snapshots ss ON um.user_id = ss.user_id
        WHERE um.department_id = $1
          AND ss.date = (SELECT MAX(date) FROM skill_snapshots WHERE user_id = ss.user_id)
      ),
      org_avg AS (
        SELECT AVG(corrix_score) as org_avg
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        JOIN departments d ON d.organization_id = u.organization_id
        WHERE d.id = $1 ${dateFilter}
      )
      SELECT di.*, dsc.*, sd.*, oa.org_avg
      FROM dept_info di, dept_scores dsc, skill_dist sd, org_avg oa
    `;

    const result = await db.query(query, queryParams);
    const row = result.rows[0] || {};

    const recentAvg = parseFloat(row.recent_avg || 0);
    const previousAvg = parseFloat(row.previous_avg || 0);
    const trend = recentAvg > previousAvg + 2 ? 'up' : recentAvg < previousAvg - 2 ? 'down' : 'stable';

    return {
      departmentId,
      departmentName: row.name || '',
      parentDepartmentName: row.parent_name,
      totalUsers: parseInt(row.total_users || 0),
      activeUsers: parseInt(row.active_users || 0),
      scores: {
        corrixScore: {
          mean: parseFloat(row.avg_corrix || 0),
          median: parseFloat(row.median_corrix || 0),
          trend,
        },
        results: {
          mean: parseFloat(row.avg_results || 0),
          median: parseFloat(row.median_results || 0),
        },
        relationship: {
          mean: parseFloat(row.avg_relationship || 0),
          median: parseFloat(row.median_relationship || 0),
        },
        resilience: {
          mean: parseFloat(row.avg_resilience || 0),
          median: parseFloat(row.median_resilience || 0),
        },
      },
      vsOrganization: {
        corrixScoreDiff: parseFloat(row.avg_corrix || 0) - parseFloat(row.org_avg || 0),
        percentileInOrg: 0,
      },
      topPerformers: [],
      skillDistribution: {
        belowBaseline: parseFloat(row.below_baseline || 0),
        baseline: parseFloat(row.baseline || 0),
        competent: parseFloat(row.competent || 0),
        proficient: parseFloat(row.proficient || 0),
        expert: parseFloat(row.expert || 0),
      },
    };
  }

  /**
   * Get role analytics
   * Capability #36
   */
  async getRoleAnalytics(params: {
    organizationId: string;
    category?: RoleCategory;
    startDate?: string;
    endDate?: string;
  }): Promise<RoleAnalytics[]> {
    const { organizationId, category, startDate, endDate } = params;

    const conditions: string[] = ['r.organization_id = $1'];
    const queryParams: string[] = [organizationId];
    let paramIndex = 2;

    if (category) {
      conditions.push(`r.category = $${paramIndex++}`);
      queryParams.push(category);
    }

    const dateConditions: string[] = [];
    if (startDate) {
      dateConditions.push(`ds.date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate) {
      dateConditions.push(`ds.date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    const dateFilter = dateConditions.length > 0 ? `AND ${dateConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        r.id as role_id,
        r.name as role_name,
        r.category,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN ds.date >= CURRENT_DATE - INTERVAL '30 days' THEN u.id END) as active_users,
        AVG(ds.corrix_score) as avg_corrix,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.corrix_score) as median_corrix,
        AVG(ds.results_score) as avg_results,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.results_score) as median_results,
        AVG(ds.relationship_score) as avg_relationship,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.relationship_score) as median_relationship,
        AVG(ds.resilience_score) as avg_resilience,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ds.resilience_score) as median_resilience,
        AVG(bs.prompt_word_count) as avg_prompt_length,
        AVG(bs.conversation_depth) as avg_dialogue_depth,
        AVG(CASE WHEN bs.has_verification_request THEN 1 ELSE 0 END) * 100 as verification_rate,
        MODE() WITHIN GROUP (ORDER BY bs.platform) as preferred_platform
      FROM roles r
      LEFT JOIN user_metadata um ON r.id = um.role_id
      LEFT JOIN users u ON um.user_id = u.id
      LEFT JOIN daily_scores ds ON u.id = ds.user_id ${dateFilter}
      LEFT JOIN behavioral_signals bs ON u.id = bs.user_id ${dateFilter ? dateFilter.replace('ds.date', 'bs.timestamp::date') : ''}
      WHERE ${conditions.join(' AND ')}
      GROUP BY r.id, r.name, r.category
      ORDER BY avg_corrix DESC NULLS LAST
    `;

    const result = await db.query(query, queryParams);

    return result.rows.map(row => ({
      roleId: row.role_id,
      roleName: row.role_name,
      roleCategory: row.category as RoleCategory,
      totalUsers: parseInt(row.total_users || 0),
      activeUsers: parseInt(row.active_users || 0),
      scores: {
        corrixScore: {
          mean: parseFloat(row.avg_corrix || 0),
          median: parseFloat(row.median_corrix || 0),
        },
        results: {
          mean: parseFloat(row.avg_results || 0),
          median: parseFloat(row.median_results || 0),
        },
        relationship: {
          mean: parseFloat(row.avg_relationship || 0),
          median: parseFloat(row.median_relationship || 0),
        },
        resilience: {
          mean: parseFloat(row.avg_resilience || 0),
          median: parseFloat(row.median_resilience || 0),
        },
      },
      patterns: {
        averagePromptLength: parseFloat(row.avg_prompt_length || 0),
        averageDialogueDepth: parseFloat(row.avg_dialogue_depth || 0),
        verificationRate: parseFloat(row.verification_rate || 0),
        preferredPlatform: (row.preferred_platform || 'other') as 'claude' | 'chatgpt' | 'gemini' | 'other',
        peakUsageHours: [],
      },
      vsSimilarRoles: [],
      benchmarkTarget: 75,
      percentAtTarget: 0,
    }));
  }

  /**
   * Get benchmark data for a specific metric
   */
  async getMetricBenchmark(params: {
    metricName: string;
    organizationId: string;
    scope?: BenchmarkScope;
    scopeId?: string;
  }): Promise<Benchmark | null> {
    const { metricName, organizationId, scope = 'organization', scopeId } = params;

    const conditions: string[] = ['metric_name = $1', 'scope_type = $2'];
    const queryParams: (string | null)[] = [metricName, scope];

    if (scopeId) {
      conditions.push('scope_id = $3');
      queryParams.push(scopeId);
    } else if (scope === 'organization') {
      conditions.push('scope_id = $3');
      queryParams.push(organizationId);
    } else {
      conditions.push('scope_id IS NULL');
    }

    const query = `
      SELECT *
      FROM benchmarks
      WHERE ${conditions.join(' AND ')}
      ORDER BY period_end DESC
      LIMIT 1
    `;

    const result = await db.query(query, queryParams.filter(p => p !== null));

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      scopeType: row.scope_type,
      scopeId: row.scope_id,
      metricName: row.metric_name,
      metricDimension: row.metric_dimension,
      mean: parseFloat(row.mean),
      median: parseFloat(row.median),
      stddev: parseFloat(row.stddev || 0),
      percentiles: {
        p10: parseFloat(row.p10 || 0),
        p25: parseFloat(row.p25 || 0),
        p50: parseFloat(row.p50 || 0),
        p75: parseFloat(row.p75 || 0),
        p90: parseFloat(row.p90 || 0),
        p95: parseFloat(row.p95 || 0),
      },
      sampleSize: parseInt(row.sample_size),
      activeUsers: parseInt(row.active_users || 0),
      periodStart: row.period_start.toISOString().split('T')[0],
      periodEnd: row.period_end.toISOString().split('T')[0],
    };
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(params: {
    userId: string;
    departmentId?: string;
    roleId?: string;
    seniorityLevel?: SeniorityLevel;
  }): Promise<void> {
    const { userId, departmentId, roleId, seniorityLevel } = params;

    const query = `
      INSERT INTO user_metadata (user_id, department_id, role_id, seniority_level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        department_id = COALESCE($2, user_metadata.department_id),
        role_id = COALESCE($3, user_metadata.role_id),
        seniority_level = COALESCE($4, user_metadata.seniority_level),
        updated_at = NOW()
    `;

    await db.query(query, [userId, departmentId, roleId, seniorityLevel]);
  }

  /**
   * List all departments for an organization
   */
  async listDepartments(organizationId: string): Promise<DepartmentSummary[]> {
    const query = `
      SELECT
        d.id,
        d.name,
        d.slug,
        d.parent_department_id as parent_id,
        COUNT(um.user_id) as user_count
      FROM departments d
      LEFT JOIN user_metadata um ON d.id = um.department_id
      WHERE d.organization_id = $1
      GROUP BY d.id, d.name, d.slug, d.parent_department_id
      ORDER BY d.name
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentId: row.parent_id,
      userCount: parseInt(row.user_count),
    }));
  }

  /**
   * List all roles for an organization
   */
  async listRoles(organizationId: string): Promise<RoleSummary[]> {
    const query = `
      SELECT
        r.id,
        r.name,
        r.slug,
        r.category,
        COUNT(um.user_id) as user_count
      FROM roles r
      LEFT JOIN user_metadata um ON r.id = um.role_id
      WHERE r.organization_id = $1
      GROUP BY r.id, r.name, r.slug, r.category
      ORDER BY r.name
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category as RoleCategory,
      userCount: parseInt(row.user_count),
    }));
  }
}
