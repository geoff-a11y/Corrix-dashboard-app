import { useEffect, useState } from 'react';
import { benchmarksApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { DepartmentComparisonChart } from '@/components/charts/DepartmentComparisonChart';
import type { DepartmentComparison, RoleAnalytics } from '@corrix/shared';
import { clsx } from 'clsx';

export function BenchmarksPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [departments, setDepartments] = useState<DepartmentComparison | null>(null);
  const [roles, setRoles] = useState<RoleAnalytics[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [deptData, rolesData] = await Promise.all([
          benchmarksApi.getDepartmentComparison({
            organizationId: scope.organizationId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
          benchmarksApi.getRoleAnalytics({
            organizationId: scope.organizationId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
        ]);

        setDepartments(deptData);
        setRoles(rolesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading benchmark data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-score-low mb-2">Error loading data</p>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Benchmarks</h1>
        <p className="mt-1 text-text-secondary">
          Compare performance across departments and roles
        </p>
      </div>

      {/* Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departments && (
          <DepartmentComparisonChart
            data={departments}
            onDepartmentClick={setSelectedDepartmentId}
          />
        )}

        {/* Department Detail */}
        {selectedDepartmentId && departments && (
          <div className="card">
            {(() => {
              const dept = departments.departments.find(d => d.departmentId === selectedDepartmentId);
              if (!dept) return <p className="text-text-muted">Department not found</p>;

              return (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">{dept.departmentName}</h3>
                      <p className="text-sm text-text-muted">
                        {dept.activeUsers} active / {dept.totalUsers} total users
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedDepartmentId(null)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-text-muted">Corrix Score</p>
                      <p className="text-2xl font-bold text-text-primary">{dept.scores.corrixScore.mean.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">vs Organization</p>
                      <p className={clsx(
                        'text-2xl font-bold',
                        dept.vsOrganization.corrixScoreDiff >= 0 ? 'text-score-high' : 'text-score-low'
                      )}>
                        {dept.vsOrganization.corrixScoreDiff >= 0 ? '+' : ''}{dept.vsOrganization.corrixScoreDiff.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-text-secondary">Skill Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Expert (95+)', value: dept.skillDistribution.expert, color: 'bg-purple-500' },
                        { label: 'Proficient (85-94)', value: dept.skillDistribution.proficient, color: 'bg-score-high' },
                        { label: 'Competent (70-84)', value: dept.skillDistribution.competent, color: 'bg-blue-500' },
                        { label: 'Baseline (50-69)', value: dept.skillDistribution.baseline, color: 'bg-score-medium' },
                        { label: 'Below Baseline (<50)', value: dept.skillDistribution.belowBaseline, color: 'bg-score-low' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-xs text-text-muted w-32">{item.label}</span>
                          <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.color}`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-primary w-10 text-right">{item.value.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {!selectedDepartmentId && (
          <div className="card h-full flex items-center justify-center">
            <p className="text-text-muted text-center">
              Click a department<br />to view details
            </p>
          </div>
        )}
      </div>

      {/* Role Analytics */}
      <div className="card">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Role Analytics</h3>
        {roles.length === 0 ? (
          <p className="text-text-muted text-sm">No role data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-text-muted">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Users</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Corrix Score</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Results</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Relationship</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Resilience</th>
                  <th className="text-right py-3 px-4 font-medium text-text-muted">Verification Rate</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.roleId} className="border-b border-border-default hover:bg-bg-secondary">
                    <td className="py-3 px-4 font-medium text-text-primary">{role.roleName}</td>
                    <td className="py-3 px-4 text-text-muted capitalize">{role.roleCategory}</td>
                    <td className="py-3 px-4 text-right text-text-primary">{role.activeUsers}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={clsx(
                        'font-bold',
                        role.scores.corrixScore.mean >= 70 ? 'text-score-high' :
                        role.scores.corrixScore.mean >= 50 ? 'text-score-medium' : 'text-score-low'
                      )}>
                        {role.scores.corrixScore.mean.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">{role.scores.results.mean.toFixed(0)}</td>
                    <td className="py-3 px-4 text-right text-text-primary">{role.scores.relationship.mean.toFixed(0)}</td>
                    <td className="py-3 px-4 text-right text-text-primary">{role.scores.resilience.mean.toFixed(0)}</td>
                    <td className="py-3 px-4 text-right text-text-primary">{role.patterns.verificationRate.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
