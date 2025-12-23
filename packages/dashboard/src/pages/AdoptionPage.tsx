import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { organizationsApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import type { AdoptionMetrics } from '@corrix/shared';

export function AdoptionPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adoption, setAdoption] = useState<AdoptionMetrics | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Note: adoption metrics typically require an organizationId
        if (!scope.organizationId) {
          setAdoption(null);
          setLoading(false);
          return;
        }

        const data = await organizationsApi.getAdoption({
          organizationId: scope.organizationId,
          granularity: 'week',
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setAdoption(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load adoption data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading adoption data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-score-low mb-2">Error loading adoption data</p>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!scope.organizationId) {
    return (
      <div className="space-y-8 fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Adoption</h1>
          <p className="mt-1 text-text-secondary">
            Track AI tool adoption across your organization
          </p>
        </div>
        <div className="card text-center py-12">
          <p className="text-text-muted">Select an organization to view adoption data</p>
        </div>
      </div>
    );
  }

  const totalUsers = adoption?.cumulativeUsers[adoption.cumulativeUsers.length - 1]?.totalUsers || 0;

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Adoption</h1>
        <p className="mt-1 text-text-secondary">
          Track AI tool adoption across your organization
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-text-muted">Total Users</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{totalUsers}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-muted">Last 7 Days</p>
          <p className="text-3xl font-bold text-accent mt-1">{adoption?.velocity.last7Days || 0}</p>
          <p className="text-xs text-text-muted mt-1">new users</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-muted">Last 30 Days</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{adoption?.velocity.last30Days || 0}</p>
          <p className="text-xs text-text-muted mt-1">new users</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-muted">Weekly Average</p>
          <p className="text-3xl font-bold text-text-primary mt-1">
            {adoption?.velocity.averagePerWeek.toFixed(1) || 0}
          </p>
          <p className="text-xs text-text-muted mt-1">new users per week</p>
        </div>
      </div>

      {/* Adoption Curve */}
      {adoption && adoption.cumulativeUsers.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Cumulative User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={adoption.cumulativeUsers} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5b4cdb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5b4cdb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#252b3d',
                  border: '1px solid #343a4d',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number) => [value, 'Total Users']}
              />
              <Area
                type="monotone"
                dataKey="totalUsers"
                stroke="#5b4cdb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Team Adoption */}
      {adoption && adoption.teamAdoption.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Adoption by Team</h3>
          <div className="space-y-4">
            {adoption.teamAdoption
              .sort((a, b) => b.adoptedMembers - a.adoptedMembers)
              .map((team) => (
                <div key={team.teamId}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">{team.teamName}</span>
                      <span className="text-xs text-text-muted">
                        {team.adoptedMembers} members
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.min(100, (team.adoptedMembers / Math.max(totalUsers, 1)) * 100 * 5)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {adoption && adoption.cumulativeUsers.length === 0 && adoption.teamAdoption.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-text-muted">No adoption data available yet</p>
        </div>
      )}
    </div>
  );
}
