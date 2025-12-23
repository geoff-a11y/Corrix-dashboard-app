import { useEffect, useState } from 'react';
import { coachingApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { Skeleton, SkeletonCard, SkeletonChart } from '@/components';
import { EffectivenessMatrixChart } from '@/components/charts/EffectivenessMatrixChart';
import { TipBreakdownTable } from '@/components/charts/TipBreakdownTable';
import { CoachingTrendChart } from '@/components/charts/CoachingTrendChart';
import { RecommendationsPanel } from '@/components/charts/RecommendationsPanel';
import { TipControls } from '@/components/TipControls';
import type { CoachingAnalyticsResponse } from '@corrix/shared';

export function CoachingInsightsPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CoachingAnalyticsResponse | null>(null);
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
        const data = await coachingApi.getAnalytics(params);
        setAnalytics(data);
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
