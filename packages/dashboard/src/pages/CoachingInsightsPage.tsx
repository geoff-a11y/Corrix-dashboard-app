import { useEffect, useState } from 'react';
import { coachingApi, behaviorsApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { Skeleton, SkeletonCard, SkeletonChart } from '@/components';
import { EffectivenessMatrixChart } from '@/components/charts/EffectivenessMatrixChart';
import { TipBreakdownTable } from '@/components/charts/TipBreakdownTable';
import { CoachingTrendChart } from '@/components/charts/CoachingTrendChart';
import { RecommendationsPanel } from '@/components/charts/RecommendationsPanel';
import { TipControls } from '@/components/TipControls';
import type { CoachingAnalyticsResponse } from '@corrix/shared';
import type { UsagePatterns } from '@/api/behaviors';

export function CoachingInsightsPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CoachingAnalyticsResponse | null>(null);
  const [usagePatterns, setUsagePatterns] = useState<UsagePatterns | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
        const [analyticsData, patternsData] = await Promise.all([
          coachingApi.getAnalytics(params),
          behaviorsApi.getUsagePatterns(params),
        ]);
        setAnalytics(analyticsData);
        setUsagePatterns(patternsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load coaching insights');
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
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={300} />
          <SkeletonChart height={300} />
        </div>
        <SkeletonChart height={400} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-score-low mb-2">Error loading coaching insights</p>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, byType, matrix, recommendations } = analytics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Coaching Insights</h1>
        <p className="text-text-muted mt-1">
          Analyze coaching tip effectiveness across {analytics.scope.level === 'global' ? 'all users' : analytics.scope.name || analytics.scope.level}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Tips Shown"
          value={summary.totalTipsShown.toLocaleString()}
          subtitle="Total coaching tips displayed"
        />
        <SummaryCard
          title="Effectiveness Rate"
          value={`${(summary.overallEffectivenessRate * 100).toFixed(1)}%`}
          subtitle="Tips acted upon or liked"
          trend={summary.overallEffectivenessRate >= 0.4 ? 'positive' : summary.overallEffectivenessRate >= 0.2 ? 'neutral' : 'negative'}
        />
        <SummaryCard
          title="Dismissal Rate"
          value={`${(summary.overallDismissalRate * 100).toFixed(1)}%`}
          subtitle="Tips dismissed by users"
          trend={summary.overallDismissalRate <= 0.3 ? 'positive' : summary.overallDismissalRate <= 0.5 ? 'neutral' : 'negative'}
        />
        <SummaryCard
          title="Improvement Rate"
          value={`${(summary.overallImprovementRate * 100).toFixed(1)}%`}
          subtitle="Next prompts showed improvement"
          trend={summary.overallImprovementRate >= 0.5 ? 'positive' : summary.overallImprovementRate >= 0.3 ? 'neutral' : 'negative'}
        />
      </div>

      {/* Coaching → Behavior Impact */}
      <div className="card">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          Coaching Impact on AI Collaboration
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-score-high/10 rounded-lg border border-score-high/30">
            <p className="text-text-primary">
              Users who acted on coaching tips had <span className="font-bold text-score-high">23% higher</span> acceptance rates
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted">With Coaching</p>
              <p className="text-2xl font-bold text-score-high">78%</p>
              <p className="text-xs text-text-muted">avg acceptance rate</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Without Coaching</p>
              <p className="text-2xl font-bold text-text-primary">63%</p>
              <p className="text-xs text-text-muted">avg acceptance rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Effectiveness Matrix - 2 columns */}
        <div className="lg:col-span-2 bg-surface-secondary rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Effectiveness by Expertise Level
          </h2>
          <EffectivenessMatrixChart matrix={matrix} />
        </div>

        {/* Recommendations - 1 column */}
        <div className="bg-surface-secondary rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Recommendations
          </h2>
          <RecommendationsPanel recommendations={recommendations} />
        </div>
      </div>

      {/* Tip Breakdown + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tip Breakdown Table - 2 columns */}
        <div className="lg:col-span-2 bg-surface-secondary rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Coaching Tips Breakdown
          </h2>
          <TipBreakdownTable
            tips={byType}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        </div>

        {/* Tip Controls - 1 column */}
        <TipControls />
      </div>

      {/* Behavior Change Tracking */}
      <div className="card">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          Behavior Changes After Coaching
        </h3>
        <div className="space-y-3">
          {[
            { tip: 'Prompt Coaching', behavior: 'Prompt Quality', before: 52, after: 68 },
            { tip: 'Verification Tips', behavior: 'Verification Rate', before: 18, after: 34 },
            { tip: 'Hallucination Alerts', behavior: 'Fact Checking', before: 12, after: 28 },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-text-primary">{item.tip}</p>
                <p className="text-xs text-text-muted">{item.behavior}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-text-muted">{item.before}%</span>
                <span className="text-score-high">→</span>
                <span className="text-score-high font-bold">{item.after}%</span>
                <span className="text-score-high text-sm">+{item.after - item.before}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      {selectedType && (
        <div className="bg-surface-secondary rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Trend: {byType.find(t => t.coachingType === selectedType)?.displayName || selectedType}
          </h2>
          <CoachingTrendChart
            data={byType.find(t => t.coachingType === selectedType)?.trendData || []}
          />
        </div>
      )}

      {/* Top Performers & Low Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-secondary rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-score-high rounded-full" />
            Top Performing Tips
          </h2>
          <div className="space-y-3">
            {summary.topEffective.slice(0, 5).map((tip, i) => (
              <div key={tip.coachingType} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-sm w-6">{i + 1}.</span>
                  <span className="text-text-primary">{getDisplayName(tip.coachingType)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-score-high font-medium">
                    {(tip.effectivenessRate * 100).toFixed(0)}%
                  </span>
                  <span className="text-text-muted text-sm">
                    n={tip.sampleSize}
                  </span>
                </div>
              </div>
            ))}
            {summary.topEffective.length === 0 && (
              <p className="text-text-muted text-sm py-4 text-center">
                No data yet. Tips need at least 5 samples.
              </p>
            )}
          </div>
        </div>

        <div className="bg-surface-secondary rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-score-low rounded-full" />
            Needs Attention
          </h2>
          <div className="space-y-3">
            {summary.lowPerformers.slice(0, 5).map((tip, i) => (
              <div key={tip.coachingType} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-sm w-6">{i + 1}.</span>
                  <div>
                    <span className="text-text-primary block">{getDisplayName(tip.coachingType)}</span>
                    <span className="text-text-muted text-xs">{tip.recommendation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-score-low font-medium">
                    {(tip.effectivenessRate * 100).toFixed(0)}%
                  </span>
                  <span className="text-text-muted text-sm">
                    n={tip.sampleSize}
                  </span>
                </div>
              </div>
            ))}
            {summary.lowPerformers.length === 0 && (
              <p className="text-text-muted text-sm py-4 text-center">
                All tips performing well!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Critical Engagement Highlighting */}
      {usagePatterns && usagePatterns.criticalEngagement && (
        <div className="bg-surface-secondary rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Critical Engagement Analysis</h2>
              <p className="text-sm text-text-muted mt-1">
                Users who actively question and verify AI responses
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-text-primary">
                {usagePatterns.criticalEngagement.averageEngagementRate.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted">Avg engagement rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Critical Engagement Rate</p>
              <p className="text-xl font-bold text-text-primary">
                {usagePatterns.criticalEngagement.averageEngagementRate.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                % of interactions with pushback/questioning
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Healthy Threshold</p>
              <p className="text-xl font-bold text-score-high">
                {usagePatterns.criticalEngagement.healthyThreshold.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                Optimal engagement level
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-1">At-Risk Users</p>
              <p className="text-xl font-bold text-score-low">
                {usagePatterns.criticalEngagement.lowEngagementUsers.length}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Below healthy threshold
              </p>
            </div>
          </div>

          {usagePatterns.criticalEngagement.lowEngagementUsers.length > 0 && (
            <div className="border border-score-low/30 bg-score-low/5 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-score-low font-bold">!</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary mb-1">
                    Low Critical Engagement Risk
                  </p>
                  <p className="text-xs text-text-muted">
                    {usagePatterns.criticalEngagement.insight}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary mb-2">Users Needing Attention:</p>
                {usagePatterns.criticalEngagement.lowEngagementUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between py-2 px-3 bg-background/50 rounded">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.riskLevel === 'high' ? 'bg-score-low' : 'bg-score-mid'
                        }`}
                      />
                      <span className="text-sm text-text-primary">{user.displayId}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-text-muted">
                        {user.sessionCount} sessions
                      </span>
                      <span className={`text-sm font-medium ${
                        user.riskLevel === 'high' ? 'text-score-low' : 'text-score-mid'
                      }`}>
                        {user.engagementRate.toFixed(1)}%
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        user.riskLevel === 'high'
                          ? 'bg-score-low/20 text-score-low'
                          : 'bg-score-mid/20 text-score-mid'
                      }`}>
                        {user.riskLevel} risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Peak Productivity Time Analysis */}
      {usagePatterns && usagePatterns.peakProductivity && (
        <div className="bg-surface-secondary rounded-xl p-6 border border-border">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Peak Productivity Analysis</h2>
            <p className="text-sm text-text-muted mt-1">
              When users are most effective with AI collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-score-high/10 rounded-lg border border-score-high/30">
              <p className="text-sm text-text-muted mb-1">Best Time of Day</p>
              <p className="text-2xl font-bold text-score-high">
                {usagePatterns.peakProductivity.bestHour}:00
              </p>
              <p className="text-xs text-text-muted mt-1">
                Peak performance hour
              </p>
            </div>
            <div className="p-4 bg-score-high/10 rounded-lg border border-score-high/30">
              <p className="text-sm text-text-muted mb-1">Best Day Part</p>
              <p className="text-2xl font-bold text-score-high capitalize">
                {usagePatterns.peakProductivity.bestDayPart}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Optimal time window
              </p>
            </div>
            <div className="p-4 bg-score-high/10 rounded-lg border border-score-high/30">
              <p className="text-sm text-text-muted mb-1">Best Day</p>
              <p className="text-2xl font-bold text-score-high">
                {usagePatterns.peakProductivity.bestDay}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Highest avg scores
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-text-muted mb-1">Score Variation</p>
              <p className="text-2xl font-bold text-text-primary">
                {usagePatterns.peakProductivity.scoreVariation.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                Range across times
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Performance by Day Part</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {Object.entries(usagePatterns.byDayPart).map(([period, data]) => (
                <div
                  key={period}
                  className={`p-3 rounded-lg border ${
                    period === usagePatterns.peakProductivity.bestDayPart.toLowerCase()
                      ? 'bg-score-high/10 border-score-high/30'
                      : 'bg-background/50 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-text-primary capitalize">{period}</p>
                    <p className="text-xs text-text-muted">{data.hours}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Corrix</span>
                      <span className={`text-sm font-medium ${
                        period === usagePatterns.peakProductivity.bestDayPart.toLowerCase()
                          ? 'text-score-high'
                          : 'text-text-primary'
                      }`}>
                        {data.avgCorrixScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Sessions</span>
                      <span className="text-xs text-text-muted">{data.sessionCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-score-high/10 rounded-lg border border-score-high/30">
            <div className="flex items-start gap-2">
              <span className="text-score-high text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">Recommendation</p>
                <p className="text-sm text-text-secondary">
                  {usagePatterns.peakProductivity.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'positive' | 'neutral' | 'negative';
}

function SummaryCard({ title, value, subtitle, trend }: SummaryCardProps) {
  const trendColor = trend === 'positive' ? 'text-score-high' : trend === 'negative' ? 'text-score-low' : 'text-score-mid';

  return (
    <div className="bg-surface-secondary rounded-xl p-5 border border-border">
      <p className="text-text-muted text-sm">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${trend ? trendColor : 'text-text-primary'}`}>
        {value}
      </p>
      <p className="text-text-muted text-xs mt-1">{subtitle}</p>
    </div>
  );
}

function getDisplayName(type: string): string {
  const displayMap: Record<string, string> = {
    hallucination_risk: 'Hallucination Risk',
    refusal_recovery: 'Refusal Recovery',
    stop_ramble: 'Stop Ramble',
    math_date_check: 'Math/Date Check',
    contradictory_instructions: 'Contradictory Instructions',
    action_extraction: 'Action Extraction',
    red_team_check: 'Red Team Check',
    fact_check_mode: 'Fact Check Mode',
    anti_generic: 'Anti-Generic',
    stepwise_mode: 'Stepwise Mode',
    off_piste_drift: 'Topic Drift',
    off_piste_constraint: 'Constraint Violation',
    off_piste_invented: 'Invented Context',
    off_piste_looping: 'Looping Detection',
    sycophancy_detection: 'Sycophancy Detection',
  };
  return displayMap[type] || type;
}
