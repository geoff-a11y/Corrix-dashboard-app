import { Router } from 'express';
import { BenchmarkService } from '../services/BenchmarkService.js';
import { requireAdmin } from '../middleware/auth.js';
import { cacheBenchmarks, cacheLists } from '../middleware/cache.js';
import type { RoleCategory, BenchmarkScope, SeniorityLevel } from '@corrix/shared';

const router = Router();
const benchmarkService = new BenchmarkService();

/**
 * GET /api/benchmarks/departments
 * Capability #35: Department Benchmarking
 */
router.get('/departments', cacheBenchmarks, async (req, res) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    const comparison = await benchmarkService.getDepartmentComparison({
      organizationId: organizationId as string,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(comparison);
  } catch (error) {
    console.error('[Benchmarks] Departments error:', error);
    res.status(500).json({ error: 'Failed to fetch department comparison' });
  }
});

/**
 * GET /api/benchmarks/departments/list
 *
 * List all departments for an organization
 */
router.get('/departments/list', cacheLists, async (req, res) => {
  try {
    const { organizationId } = req.query;

    const departments = await benchmarkService.listDepartments(organizationId as string);

    res.json(departments);
  } catch (error) {
    console.error('[Benchmarks] Departments list error:', error);
    res.status(500).json({ error: 'Failed to list departments' });
  }
});

/**
 * GET /api/benchmarks/departments/:departmentId
 *
 * Detailed department analytics
 */
router.get('/departments/:departmentId', cacheBenchmarks, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const analytics = await benchmarkService.getDepartmentAnalytics({
      departmentId,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analytics);
  } catch (error) {
    console.error('[Benchmarks] Department analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch department analytics' });
  }
});

/**
 * GET /api/benchmarks/roles
 * Capability #36: Role-Based Analytics
 */
router.get('/roles', cacheBenchmarks, async (req, res) => {
  try {
    const { organizationId, category, startDate, endDate } = req.query;

    const analytics = await benchmarkService.getRoleAnalytics({
      organizationId: organizationId as string,
      category: category as RoleCategory | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json(analytics);
  } catch (error) {
    console.error('[Benchmarks] Roles error:', error);
    res.status(500).json({ error: 'Failed to fetch role analytics' });
  }
});

/**
 * GET /api/benchmarks/roles/list
 *
 * List all roles for an organization
 */
router.get('/roles/list', cacheLists, async (req, res) => {
  try {
    const { organizationId } = req.query;

    const roles = await benchmarkService.listRoles(organizationId as string);

    res.json(roles);
  } catch (error) {
    console.error('[Benchmarks] Roles list error:', error);
    res.status(500).json({ error: 'Failed to list roles' });
  }
});

/**
 * GET /api/benchmarks/metric/:metricName
 *
 * Get benchmark data for a specific metric
 */
router.get('/metric/:metricName', cacheBenchmarks, async (req, res) => {
  try {
    const { metricName } = req.params;
    const { organizationId, scope, scopeId } = req.query;

    const benchmark = await benchmarkService.getMetricBenchmark({
      metricName,
      organizationId: organizationId as string,
      scope: scope as BenchmarkScope | undefined,
      scopeId: scopeId as string | undefined,
    });

    res.json(benchmark);
  } catch (error) {
    console.error('[Benchmarks] Metric error:', error);
    res.status(500).json({ error: 'Failed to fetch metric benchmark' });
  }
});

/**
 * POST /api/benchmarks/user-metadata
 *
 * Update user metadata (role, department, seniority)
 */
router.post('/user-metadata', requireAdmin, async (req, res) => {
  try {
    const { userId, departmentId, roleId, seniorityLevel } = req.body;

    await benchmarkService.updateUserMetadata({
      userId,
      departmentId,
      roleId,
      seniorityLevel: seniorityLevel as SeniorityLevel | undefined,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Benchmarks] User metadata error:', error);
    res.status(500).json({ error: 'Failed to update user metadata' });
  }
});

export default router;
