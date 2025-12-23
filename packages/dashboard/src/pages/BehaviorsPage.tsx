import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { behaviorsApi, type CollaborationModeAnalytics } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { Skeleton, SkeletonCard, SkeletonChart } from '@/components';
import type { ScoreDistribution, BehaviorMetrics } from '@corrix/shared';

export function BehaviorsPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [promptQuality, setPromptQuality] = useState<ScoreDistribution | null>(null);
  const [actions, setActions] = useState<BehaviorMetrics['actions'] | null>(null);
  const [sessions, setSessions] = useState<BehaviorMetrics['sessions'] | null>(null);
  const [platforms, setPlatforms] = useState<BehaviorMetrics['platforms'] | null>(null);
  const [collaborationModes, setCollaborationModes] = useState<CollaborationModeAnalytics | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const params = {
        organizationId: scope.organizationId,
        teamId: scope.level === 'team' ? scope.teamId : undefined,
        userId: scope.userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      try {
        const [promptData, actionsData, sessionsData, platformsData, modesData] = await Promise.all([
          behaviorsApi.getPromptQuality(params),
          behaviorsApi.getActions(params),
          behaviorsApi.getSessions(params),
          behaviorsApi.getPlatforms(params),
          behaviorsApi.getCollaborationModes(params),
        ]);

        setPromptQuality(promptData);
        setActions(actionsData);
        setSessions(sessionsData);
        setPlatforms(platformsData);
        setCollaborationModes(modesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load behaviors');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, dateRange]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-28 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={250} />
          <SkeletonChart height={250} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-score-low mb-2">Error loading behaviors</p>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  const actionData = actions ? [
    { name: 'Accept', value: actions.accept, color: '#22c55e' },
    { name: 'Edit', value: actions.edit, color: '#3b82f6' },
    { name: 'Copy', value: actions.copy, color: '#8b7cf7' },
    { name: 'Regenerate', value: actions.regenerate, color: '#eab308' },
    { name: 'Abandon', value: actions.abandon, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const platformData = platforms ? [
    { name: 'Claude', value: platforms.claude, color: '#5b4cdb' },
    { name: 'ChatGPT', value: platforms.chatgpt, color: '#10a37f' },
    { name: 'Gemini', value: platforms.gemini, color: '#4285f4' },
  ].filter(d => d.value > 0) : [];

  const modeColors: Record<string, string> = {
    approving: '#22c55e',   // Green - validation/checking
    consulting: '#3b82f6',  // Blue - seeking advice
    supervising: '#f59e0b', // Orange - reviewing AI work
    delegating: '#8b7cf7',  // Purple - autonomous AI
  };

  const modeTimeData = collaborationModes?.modes.map((m: { displayName: string; percentage: number; mode: string }) => ({
    name: m.displayName,
    value: m.percentage,
    color: modeColors[m.mode] || '#6b7280',
  })) || [];

  const modeScoreData = collaborationModes?.modes.map((m: { displayName: string; avgScore: number; mode: string }) => ({
    name: m.displayName,
    score: m.avgScore,
    fill: modeColors[m.mode] || '#6b7280',
  })) || [];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Behaviors</h1>
        <p className="mt-1 text-text-secondary">
          Behavioral patterns and interaction analysis
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-accent">
            {promptQuality ? Math.round(promptQuality.mean) : '-'}
          </p>
          <p className="text-sm text-text-muted mt-1">Avg Prompt Quality</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-text-primary">
            {sessions ? `${Math.round(sessions.averageDuration / 60)}m` : '-'}
          </p>
          <p className="text-sm text-text-muted mt-1">Avg Session Duration</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-text-primary">
            {sessions ? sessions.averageDepth.toFixed(1) : '-'}
          </p>
          <p className="text-sm text-text-muted mt-1">Avg Conversation Depth</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-score-high">
            {actions ? `${Math.round(actions.accept)}%` : '-'}
          </p>
          <p className="text-sm text-text-muted mt-1">Accept Rate</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Distribution */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Action Distribution</h3>
          {actionData.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-12">No action data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={actionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {actionData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252b3d',
                    border: '1px solid #343a4d',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform Distribution */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Platform Usage</h3>
          {platformData.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-12">No platform data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252b3d',
                    border: '1px solid #343a4d',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Collaboration Mode Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Time Distribution */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Time by Collaboration Mode</h3>
          {modeTimeData.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-12">No collaboration mode data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={modeTimeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {modeTimeData.map((entry: { name: string; value: number; color: string }, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252b3d',
                    border: '1px solid #343a4d',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Time Spent']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mode Average Score */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Avg Prompt Quality by Mode</h3>
          {modeScoreData.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-12">No collaboration mode data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={modeScoreData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#343a4d" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#343a4d' }}
                  tickLine={{ stroke: '#343a4d' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#343a4d' }}
                  tickLine={{ stroke: '#343a4d' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252b3d',
                    border: '1px solid #343a4d',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}`, 'Avg Score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Prompt Quality Distribution */}
      {promptQuality && promptQuality.buckets.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Prompt Quality Distribution</h3>
          <div className="grid grid-cols-5 gap-2 text-center mb-4">
            <div>
              <p className="text-xs text-text-muted">P10</p>
              <p className="text-sm font-medium text-text-primary">{Math.round(promptQuality.percentiles.p10)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">P25</p>
              <p className="text-sm font-medium text-text-primary">{Math.round(promptQuality.percentiles.p25)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Median</p>
              <p className="text-sm font-medium text-text-primary">{Math.round(promptQuality.median)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">P75</p>
              <p className="text-sm font-medium text-text-primary">{Math.round(promptQuality.percentiles.p75)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">P90</p>
              <p className="text-sm font-medium text-text-primary">{Math.round(promptQuality.percentiles.p90)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Peak Hours */}
      {sessions && sessions.peakHours.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Peak Usage Hours</h3>
          <p className="text-text-primary">
            Most active hours: {sessions.peakHours.map(h => `${h}:00`).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
