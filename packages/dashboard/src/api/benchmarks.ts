import { api } from './client';
import type {
  Benchmark,
  DepartmentAnalytics,
  RoleAnalytics,
  DepartmentComparison,
  DepartmentSummary,
  RoleSummary,
  RoleCategory,
  BenchmarkScope,
  SeniorityLevel,
} from '@corrix/shared';

interface BenchmarkParams {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}

export const benchmarksApi = {
  getDepartmentComparison(params: BenchmarkParams): Promise<DepartmentComparison> {
    return api.get('/benchmarks/departments', params);
  },

  getDepartmentAnalytics(
    departmentId: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<DepartmentAnalytics> {
    return api.get(`/benchmarks/departments/${departmentId}`, params);
  },

  listDepartments(organizationId: string): Promise<DepartmentSummary[]> {
    return api.get('/benchmarks/departments/list', { organizationId });
  },

  getRoleAnalytics(params: BenchmarkParams & {
    category?: RoleCategory;
  }): Promise<RoleAnalytics[]> {
    return api.get('/benchmarks/roles', params);
  },

  listRoles(organizationId: string): Promise<RoleSummary[]> {
    return api.get('/benchmarks/roles/list', { organizationId });
  },

  getMetricBenchmark(params: {
    metricName: string;
    organizationId: string;
    scope?: BenchmarkScope;
    scopeId?: string;
  }): Promise<Benchmark | null> {
    return api.get(`/benchmarks/metric/${params.metricName}`, {
      organizationId: params.organizationId,
      scope: params.scope,
      scopeId: params.scopeId,
    });
  },

  updateUserMetadata(data: {
    userId: string;
    departmentId?: string;
    roleId?: string;
    seniorityLevel?: SeniorityLevel;
  }): Promise<{ success: boolean }> {
    return api.post('/benchmarks/user-metadata', data);
  },
};
