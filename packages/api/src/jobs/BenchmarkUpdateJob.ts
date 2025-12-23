import db from '../db/connection.js';

/**
 * Daily job to update population benchmarks
 * Run at 3 AM UTC via cron: 0 3 * * *
 */
export async function runBenchmarkUpdateJob(): Promise<void> {
  console.log('[BenchmarkUpdateJob] Starting benchmark calculation...');
  const startTime = Date.now();

  try {
    // Get all organizations
    const orgsQuery = `SELECT id FROM organizations`;
    const orgs = await db.query(orgsQuery);

    console.log(`[BenchmarkUpdateJob] Processing ${orgs.rows.length} organizations`);

    for (const org of orgs.rows) {
      await calculateOrganizationBenchmarks(org.id);
      await calculateDepartmentBenchmarks(org.id);
      await calculateTeamBenchmarks(org.id);
      await calculateRoleBenchmarks(org.id);
    }

    const duration = Date.now() - startTime;
    console.log(`[BenchmarkUpdateJob] Completed in ${duration}ms`);
  } catch (error) {
    console.error('[BenchmarkUpdateJob] Fatal error:', error);
    throw error;
  }
}

async function calculateOrganizationBenchmarks(organizationId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const metrics = [
    { name: 'corrix_score', dimension: null, column: 'corrix_score' },
    { name: 'results_score', dimension: 'results', column: 'results_score' },
    { name: 'relationship_score', dimension: 'relationship', column: 'relationship_score' },
    { name: 'resilience_score', dimension: 'resilience', column: 'resilience_score' },
  ];

  for (const metric of metrics) {
    const query = `
      WITH scores AS (
        SELECT ds.${metric.column} as value
        FROM daily_scores ds
        JOIN users u ON ds.user_id = u.id
        WHERE u.organization_id = $1
          AND ds.date >= $2
          AND ds.${metric.column} IS NOT NULL
      )
      INSERT INTO benchmarks (
        scope_type, scope_id, metric_name, metric_dimension,
        mean, median, stddev,
        p10, p25, p50, p75, p90, p95,
        sample_size, active_users,
        period_start, period_end
      )
      SELECT
        'organization',
        $1,
        $3,
        $4,
        COALESCE(AVG(value), 0),
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(STDDEV(value), 0),
        COALESCE(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value), 0),
        COUNT(*),
        (SELECT COUNT(DISTINCT user_id) FROM daily_scores ds JOIN users u ON ds.user_id = u.id WHERE u.organization_id = $1 AND ds.date >= $2),
        $2::date,
        $5::date
      FROM scores
      ON CONFLICT (scope_type, scope_id, metric_name, period_start)
      DO UPDATE SET
        mean = EXCLUDED.mean,
        median = EXCLUDED.median,
        stddev = EXCLUDED.stddev,
        p10 = EXCLUDED.p10,
        p25 = EXCLUDED.p25,
        p50 = EXCLUDED.p50,
        p75 = EXCLUDED.p75,
        p90 = EXCLUDED.p90,
        p95 = EXCLUDED.p95,
        sample_size = EXCLUDED.sample_size,
        active_users = EXCLUDED.active_users,
        calculated_at = NOW()
    `;

    await db.query(query, [organizationId, periodStart, metric.name, metric.dimension, today]);
  }

  // Add skill benchmarks
  const skillMetrics = [
    'overall_skill_score',
    'skill_prompt_engineering',
    'skill_output_evaluation',
    'skill_verification',
    'skill_iteration',
    'skill_adaptation',
    'skill_critical_thinking',
  ];

  for (const metricName of skillMetrics) {
    const query = `
      WITH scores AS (
        SELECT ss.${metricName} as value
        FROM skill_snapshots ss
        JOIN users u ON ss.user_id = u.id
        WHERE u.organization_id = $1
          AND ss.date >= $2
          AND ss.${metricName} IS NOT NULL
      )
      INSERT INTO benchmarks (
        scope_type, scope_id, metric_name, metric_dimension,
        mean, median, stddev,
        p10, p25, p50, p75, p90, p95,
        sample_size, active_users,
        period_start, period_end
      )
      SELECT
        'organization',
        $1,
        $3,
        NULL,
        COALESCE(AVG(value), 0),
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(STDDEV(value), 0),
        COALESCE(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY value), 0),
        COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value), 0),
        COUNT(*),
        (SELECT COUNT(DISTINCT user_id) FROM skill_snapshots ss JOIN users u ON ss.user_id = u.id WHERE u.organization_id = $1 AND ss.date >= $2),
        $2::date,
        $4::date
      FROM scores
      ON CONFLICT (scope_type, scope_id, metric_name, period_start)
      DO UPDATE SET
        mean = EXCLUDED.mean,
        median = EXCLUDED.median,
        stddev = EXCLUDED.stddev,
        p10 = EXCLUDED.p10,
        p25 = EXCLUDED.p25,
        p50 = EXCLUDED.p50,
        p75 = EXCLUDED.p75,
        p90 = EXCLUDED.p90,
        p95 = EXCLUDED.p95,
        sample_size = EXCLUDED.sample_size,
        active_users = EXCLUDED.active_users,
        calculated_at = NOW()
    `;

    await db.query(query, [organizationId, periodStart, metricName, today]);
  }
}

async function calculateDepartmentBenchmarks(organizationId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const query = `
    WITH dept_scores AS (
      SELECT
        d.id as department_id,
        ds.corrix_score as value
      FROM departments d
      JOIN user_metadata um ON d.id = um.department_id
      JOIN users u ON um.user_id = u.id
      JOIN daily_scores ds ON u.id = ds.user_id
      WHERE d.organization_id = $1
        AND ds.date >= $2
        AND ds.corrix_score IS NOT NULL
    )
    INSERT INTO benchmarks (
      scope_type, scope_id, metric_name, metric_dimension,
      mean, median, stddev,
      p10, p25, p50, p75, p90, p95,
      sample_size, active_users,
      period_start, period_end
    )
    SELECT
      'department',
      department_id,
      'corrix_score',
      NULL,
      COALESCE(AVG(value), 0),
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(STDDEV(value), 0),
      COALESCE(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value), 0),
      COUNT(*),
      COUNT(DISTINCT (SELECT user_id FROM user_metadata WHERE department_id = dept_scores.department_id)),
      $2::date,
      $3::date
    FROM dept_scores
    GROUP BY department_id
    ON CONFLICT (scope_type, scope_id, metric_name, period_start)
    DO UPDATE SET
      mean = EXCLUDED.mean,
      median = EXCLUDED.median,
      stddev = EXCLUDED.stddev,
      p10 = EXCLUDED.p10,
      p25 = EXCLUDED.p25,
      p50 = EXCLUDED.p50,
      p75 = EXCLUDED.p75,
      p90 = EXCLUDED.p90,
      p95 = EXCLUDED.p95,
      sample_size = EXCLUDED.sample_size,
      active_users = EXCLUDED.active_users,
      calculated_at = NOW()
  `;

  await db.query(query, [organizationId, periodStart, today]);
}

async function calculateTeamBenchmarks(organizationId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const query = `
    WITH team_scores AS (
      SELECT
        t.id as team_id,
        ds.corrix_score as value
      FROM teams t
      JOIN users u ON t.id = u.team_id
      JOIN daily_scores ds ON u.id = ds.user_id
      WHERE t.organization_id = $1
        AND ds.date >= $2
        AND ds.corrix_score IS NOT NULL
    )
    INSERT INTO benchmarks (
      scope_type, scope_id, metric_name, metric_dimension,
      mean, median, stddev,
      p10, p25, p50, p75, p90, p95,
      sample_size, active_users,
      period_start, period_end
    )
    SELECT
      'team',
      team_id,
      'corrix_score',
      NULL,
      COALESCE(AVG(value), 0),
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(STDDEV(value), 0),
      COALESCE(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value), 0),
      COUNT(*),
      COUNT(DISTINCT (SELECT id FROM users WHERE team_id = team_scores.team_id)),
      $2::date,
      $3::date
    FROM team_scores
    GROUP BY team_id
    ON CONFLICT (scope_type, scope_id, metric_name, period_start)
    DO UPDATE SET
      mean = EXCLUDED.mean,
      median = EXCLUDED.median,
      stddev = EXCLUDED.stddev,
      p10 = EXCLUDED.p10,
      p25 = EXCLUDED.p25,
      p50 = EXCLUDED.p50,
      p75 = EXCLUDED.p75,
      p90 = EXCLUDED.p90,
      p95 = EXCLUDED.p95,
      sample_size = EXCLUDED.sample_size,
      active_users = EXCLUDED.active_users,
      calculated_at = NOW()
  `;

  await db.query(query, [organizationId, periodStart, today]);
}

async function calculateRoleBenchmarks(organizationId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const query = `
    WITH role_scores AS (
      SELECT
        r.id as role_id,
        ds.corrix_score as value
      FROM roles r
      JOIN user_metadata um ON r.id = um.role_id
      JOIN users u ON um.user_id = u.id
      JOIN daily_scores ds ON u.id = ds.user_id
      WHERE r.organization_id = $1
        AND ds.date >= $2
        AND ds.corrix_score IS NOT NULL
    )
    INSERT INTO benchmarks (
      scope_type, scope_id, metric_name, metric_dimension,
      mean, median, stddev,
      p10, p25, p50, p75, p90, p95,
      sample_size, active_users,
      period_start, period_end
    )
    SELECT
      'role',
      role_id,
      'corrix_score',
      NULL,
      COALESCE(AVG(value), 0),
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(STDDEV(value), 0),
      COALESCE(PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY value), 0),
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value), 0),
      COUNT(*),
      COUNT(DISTINCT (SELECT user_id FROM user_metadata WHERE role_id = role_scores.role_id)),
      $2::date,
      $3::date
    FROM role_scores
    GROUP BY role_id
    ON CONFLICT (scope_type, scope_id, metric_name, period_start)
    DO UPDATE SET
      mean = EXCLUDED.mean,
      median = EXCLUDED.median,
      stddev = EXCLUDED.stddev,
      p10 = EXCLUDED.p10,
      p25 = EXCLUDED.p25,
      p50 = EXCLUDED.p50,
      p75 = EXCLUDED.p75,
      p90 = EXCLUDED.p90,
      p95 = EXCLUDED.p95,
      sample_size = EXCLUDED.sample_size,
      active_users = EXCLUDED.active_users,
      calculated_at = NOW()
  `;

  await db.query(query, [organizationId, periodStart, today]);
}

// Export for use in a scheduler or CLI
export default runBenchmarkUpdateJob;
