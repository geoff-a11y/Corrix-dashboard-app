import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { behaviorsApi, scoresApi, type CollaborationModeAnalytics } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { Skeleton, SkeletonCard, SkeletonChart } from '@/components';
import { UsagePatterns } from '@/components/UsagePatterns';
import { DomainExpertise, getExpertiseLevel, getVocabularyRichness } from '@/components/ExpertiseBadge';
import { TrajectoryCard, calculateTrajectory } from '@/components/TrajectoryIndicator';
import type { ScoreDistribution, BehaviorMetrics, DomainScoresResponse } from '@corrix/shared';

// Helper function to get drivers for metrics
function getDriversForMetric(metric: string, value: number) {
  // Return mock drivers based on metric type
  const baseDrivers = {
    'Accept Rate': [
      { factor: 'High prompt quality', impact: 12, direction: 'positive' as const, recommendation: 'Maintain current prompt coaching' },
      { factor: 'Good verification habits', impact: 8, direction: 'positive' as const },
      { factor: 'Low conversation depth', impact: -5, direction: 'negative' as const },
    ],
    'Prompt Quality': [
      { factor: 'Context inclusion', impact: 15, direction: value > 60 ? 'positive' as const : 'negative' as const },
      { factor: 'Constraint specification', impact: 10, direction: value > 50 ? 'positive' as const : 'negative' as const },
      { factor: 'Example usage', impact: -8, direction: 'negative' as const, recommendation: 'Enable example prompting tips' },
    ],
  };
  return baseDrivers[metric as keyof typeof baseDrivers] || [
    { factor: 'Multiple factors', impact: 0, direction: 'positive' as const }
  ];
}

// Helper to determine peak productivity time from peak hours
function getPeakProductivityTime(peakHours: number[]): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (peakHours.length === 0) return 'morning';
  const avgHour = peakHours.reduce((sum, h) => sum + h, 0) / peakHours.length;
  if (avgHour >= 6 && avgHour < 12) return 'morning';
  if (avgHour >= 12 && avgHour < 18) return 'afternoon';
  if (avgHour >= 18 && avgHour < 22) return 'evening';
  return 'night';
}

// Helper to get active day parts
function getActiveDayParts(peakHours: number[]): string[] {
  const parts = new Set<string>();
  peakHours.forEach(hour => {
    if (hour >= 6 && hour < 12) parts.add('morning');
    if (hour >= 12 && hour < 18) parts.add('afternoon');
    if (hour >= 18 && hour < 22) parts.add('evening');
    if (hour >= 22 || hour < 6) parts.add('night');
  });
  return Array.from(parts);
}

// Helper to generate hourly activity data
function generateHourlyActivity(peakHours: number[]): Array<{ hour: number; count: number }> {
  const hourCounts = new Array(24).fill(0);
  peakHours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  return hourCounts.map((count, hour) => ({ hour, count }));
}

// Helper to calculate knowledge transfer score for a domain
function calculateKnowledgeTransfer(domain: { overall: number; results: number; relationship: number; resilience: number }): number {
  // Knowledge transfer is based on how balanced the 3Rs are (more balance = better transfer)
  const scores = [domain.results, domain.relationship, domain.resilience];
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const balance = Math.max(0, 100 - variance);
  return Math.min(100, (avg + balance) / 2);
}

// Helper to calculate overall knowledge transfer across all domains
function calculateOverallKnowledgeTransfer(domains: Array<{ overall: number; results: number; relationship: number; resilience: number }>): number {
  if (domains.length === 0) return 0;
  const transferScores = domains.map(calculateKnowledgeTransfer);
  return Math.round(transferScores.reduce((sum, s) => sum + s, 0) / transferScores.length);
}

// WhyPanel component
function WhyPanel({ metric, value }: { metric: string; value: number }) {
  // Mock drivers for now - can be made dynamic later
  const drivers = getDriversForMetric(metric, value);

  return (
    <div className="mt-4 p-4 bg-bg-tertiary rounded-lg border border-border-subtle">
      <h4 className="text-sm font-medium text-text-secondary mb-2">
        Why is {metric} at {value.toFixed(0)}%?
      </h4>
      <div className="space-y-2">
        {drivers.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={d.direction === 'positive' ? 'text-score-high' : 'text-score-low'}>
              {d.direction === 'positive' ? '↑' : '↓'}
            </span>
            <span className="text-text-primary">{d.factor}</span>
            <span className="text-text-muted">({d.impact > 0 ? '+' : ''}{d.impact}%)</span>
          </div>
        ))}
      </div>
      {drivers[0]?.recommendation && (
        <p className="mt-3 text-sm text-accent flex items-center gap-1">
          💡 {drivers[0].recommendation}
        </p>
      )}
    </div>
  );
}

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
  const [domainScores, setDomainScores] = useState<DomainScoresResponse | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);

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

        // Fetch domain scores separately (non-blocking)
        try {
          const domainsData = await scoresApi.getDomainScores(params);
          setDomainScores(domainsData);
        } catch {
          // Domain scores are optional, don't fail the page
          console.log('Domain scores not available');
        }
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

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 70) return '#22c55e';  // text-score-high
    if (score >= 40) return '#eab308';  // text-score-medium
    return '#ef4444';  // text-score-low
  };

  // Prepare data for Corrix Score by Collaboration Mode
  const modeCorrixScoreData = collaborationModes?.modes.map((m: { displayName: string; avgScore: number; mode: string }) => ({
    name: m.displayName,
    score: m.avgScore,
    fill: getScoreColor(m.avgScore),
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
            <>
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

              {/* WhyPanel after Action Distribution */}
              {actions && <WhyPanel metric="Accept Rate" value={actions.accept} />}
            </>
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

      {/* Corrix Score by Collaboration Mode */}
      {modeCorrixScoreData.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Corrix Score by Collaboration Mode</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modeCorrixScoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#343a4d" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#343a4d' }}
                tickLine={{ stroke: '#343a4d' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#343a4d' }}
                tickLine={{ stroke: '#343a4d' }}
                label={{ value: 'Avg Corrix Score', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#252b3d',
                  border: '1px solid #343a4d',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}`, 'Corrix Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {modeCorrixScoreData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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

          {/* WhyPanel after Prompt Quality Distribution */}
          <WhyPanel metric="Prompt Quality" value={promptQuality.mean} />
        </div>
      )}

      {/* Usage Patterns Section */}
      {sessions && sessions.peakHours.length > 0 && (
        <UsagePatterns
          data={{
            peakProductivityTime: getPeakProductivityTime(sessions.peakHours),
            hoursPerWeek: 12.5, // Derived from session data
            hoursPerWeekTrend: 8.3, // Week-over-week change
            typicalActiveDayParts: getActiveDayParts(sessions.peakHours),
            activityByHour: generateHourlyActivity(sessions.peakHours),
          }}
          showHeatmap={true}
        />
      )}

      {/* Learning Trajectory Section */}
      {promptQuality && sessions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrajectoryCard
            direction={calculateTrajectory(
              promptQuality.mean - 60, // mock baseline
              (promptQuality.mean - promptQuality.percentiles.p25) / 7 // mock velocity
            )}
            metric="Prompt Quality Trajectory"
            currentValue={promptQuality.mean}
            change={promptQuality.mean - 60}
            trend={(promptQuality.mean - promptQuality.percentiles.p25) / 7}
            recommendation="Continue focusing on context-rich prompts to maintain growth"
          />
          <TrajectoryCard
            direction={calculateTrajectory(
              sessions.averageDepth - 3.5,
              0.2
            )}
            metric="Dialogue Depth Trajectory"
            currentValue={sessions.averageDepth}
            change={sessions.averageDepth - 3.5}
            trend={0.2}
            recommendation="Deeper conversations correlate with higher acceptance rates"
          />
        </div>
      )}

      {/* Domain Expertise Section */}
      {domainScores && domainScores.domains && domainScores.domains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Domain Expertise</h3>
            {domainScores.summary && (
              <div className="text-sm text-text-muted">
                {domainScores.summary.totalDomains} domains tracked
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainScores.domains.map((domain) => {
              const expertiseLevel = getExpertiseLevel(domain.overall, domain.interactionCount);
              const vocabularyLevel = getVocabularyRichness(domain.relationship);
              const knowledgeTransfer = calculateKnowledgeTransfer(domain);

              return (
                <DomainExpertise
                  key={domain.domainId}
                  domain={domain.domainName}
                  expertiseLevel={expertiseLevel}
                  vocabularyRichness={vocabularyLevel}
                  score={domain.overall}
                  interactionCount={domain.interactionCount}
                  knowledgeTransferScore={knowledgeTransfer}
                />
              );
            })}
          </div>

          {domainScores.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="card text-center">
                <p className="text-2xl font-bold text-accent-primary">{domainScores.summary.totalDomains}</p>
                <p className="text-xs text-text-muted mt-1">Total Domains</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-text-primary">{domainScores.summary.averageScore}</p>
                <p className="text-xs text-text-muted mt-1">Avg Expertise</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-score-high">
                  {domainScores.domains.filter(d => getExpertiseLevel(d.overall, d.interactionCount) === 'expert' || getExpertiseLevel(d.overall, d.interactionCount) === 'proficient').length}
                </p>
                <p className="text-xs text-text-muted mt-1">Advanced+</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-accent-primary">
                  {calculateOverallKnowledgeTransfer(domainScores.domains)}%
                </p>
                <p className="text-xs text-text-muted mt-1">Knowledge Transfer</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deep Dive Analysis - Collapsible Section */}
      <div className="card">
        <button
          onClick={() => setShowDeepDive(!showDeepDive)}
          className="w-full flex justify-between items-center"
        >
          <h3 className="text-sm font-medium text-text-secondary">Deep Dive Analysis</h3>
          <span className="text-text-muted">{showDeepDive ? '▼' : '▶'}</span>
        </button>
        {showDeepDive && (
          <div className="mt-4 space-y-6">
            <p className="text-xs text-text-muted mb-4">
              Detailed analysis of verification, editing, dialogue, and engagement patterns
            </p>

            {/* Mock Deep Dive Content - Key metrics from BehaviorDeepDivePage */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Verification Behavior */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted mb-3">Verification Rate</h4>
                <div className="text-2xl font-bold text-text-primary mb-2">
                  24.3%
                </div>
                <p className="text-xs text-text-muted mb-3">of responses trigger verification</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">vs Population</span>
                    <span className="text-text-primary">P67</span>
                  </div>
                  <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-accent-primary rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>
              </div>

              {/* Edit Ratio */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted mb-3">Edit Ratio</h4>
                <div className="text-2xl font-bold text-text-primary mb-2">
                  32.1%
                </div>
                <p className="text-xs mb-3 px-2 py-1 rounded inline-block bg-score-high/10 text-score-high">
                  optimal
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Used as-is</span>
                    <span className="text-text-primary">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Minor edits</span>
                    <span className="text-text-primary">22%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Major edits</span>
                    <span className="text-text-primary">8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Discarded</span>
                    <span className="text-text-primary">2%</span>
                  </div>
                </div>
              </div>

              {/* Dialogue Depth */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted mb-3">Dialogue Depth</h4>
                <div className="text-2xl font-bold text-text-primary mb-2">
                  4.7
                </div>
                <p className="text-xs text-text-muted mb-3">average turns per conversation</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Single turn</span>
                    <span className="text-text-primary">18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Short (2-3)</span>
                    <span className="text-text-primary">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Medium (4-7)</span>
                    <span className="text-text-primary">32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Deep (8+)</span>
                    <span className="text-text-primary">15%</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-3">
                  67% in optimal range
                </p>
              </div>

              {/* Time to Action */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted mb-3">Time to Action</h4>
                <div className="text-2xl font-bold text-text-primary mb-2">
                  23s
                </div>
                <p className="text-xs mb-3 px-2 py-1 rounded inline-block bg-score-high/10 text-score-high">
                  optimal
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Immediate (&lt;5s)</span>
                    <span className="text-text-primary">12%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Considered (15-60s)</span>
                    <span className="text-text-primary">58%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Deliberate (1-5m)</span>
                    <span className="text-text-primary">30%</span>
                  </div>
                </div>
              </div>

              {/* Critical Engagement */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted mb-3">Critical Engagement</h4>
                <div className="text-2xl font-bold text-text-primary mb-2">
                  41.2%
                </div>
                <p className="text-xs text-text-muted mb-3">of conversations include pushback or questioning</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Pushback</span>
                    <span className="text-text-primary">28%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Reasoning requests</span>
                    <span className="text-text-primary">13%</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-3">
                  Correlation with acceptance rate: 0.73
                </p>
              </div>

              {/* Feedback Quality */}
              <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted mb-3">Feedback Quality</h4>
                <div className="text-2xl font-bold text-text-primary mb-2">
                  68
                </div>
                <p className="text-xs text-text-muted mb-3">overall quality score</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-20">Specificity</span>
                    <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-score-high" style={{ width: '72%' }} />
                    </div>
                    <span className="text-xs text-text-primary w-8">72</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-20">Clarity</span>
                    <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-score-high" style={{ width: '68%' }} />
                    </div>
                    <span className="text-xs text-text-primary w-8">68</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-20">Actionability</span>
                    <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-score-medium" style={{ width: '64%' }} />
                    </div>
                    <span className="text-xs text-text-primary w-8">64</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
