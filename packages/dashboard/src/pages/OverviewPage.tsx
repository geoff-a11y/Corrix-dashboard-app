import { useEffect, useState } from 'react';
import { ScoreCard, StatCard, ScoreDistributionChart, TrendChart, ThreeRsChart, SkeletonCard, SkeletonChart, SkeletonTable } from '@/components';
import { scoresApi, organizationsApi, teamsApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import type { ScoreDistribution, ScoreTrend, ThreeRsScores, TeamRankingEntry } from '@corrix/shared';

interface OrgSummary {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  averageCorrixScore: number;
  scoreChange7d: number;
  scoreChange30d: number;
}

export function OverviewPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<OrgSummary | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution | null>(null);
  const [trend, setTrend] = useState<ScoreTrend | null>(null);
  const [threeRs, setThreeRs] = useState<ThreeRsScores | null>(null);
  const [topTeams, setTopTeams] = useState<TeamRankingEntry[]>([]);

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
        const [summaryData, distData, trendData, balanceData, teamsData] = await Promise.all([
          scope.organizationId
            ? organizationsApi.getSummary(scope.organizationId)
            : Promise.resolve({ totalUsers: 0, activeUsers: 0, totalTeams: 0, averageCorrixScore: 0, scoreChange7d: 0, scoreChange30d: 0 }),
          scoresApi.getDistribution(params),
          scoresApi.getTrends({
            ...params,
            metric: 'corrix',
            period: 'day',
            duration: 30,
          }),
          scoresApi.getDimensionalBalance(params),
          scope.organizationId
            ? teamsApi.getRanking({ organizationId: scope.organizationId, limit: 5 })
            : Promise.resolve([]),
        ]);

        setSummary(summaryData);
        setDistribution(distData);
        setTrend(trendData);
        setThreeRs(balanceData);
        setTopTeams(teamsData);
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
      <div className="space-y-8">
        <div>
          <div className="h-8 w-32 bg-bg-tertiary rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-bg-tertiary rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={220} />
          <SkeletonChart height={220} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart height={280} />
          <SkeletonTable rows={5} className="lg:col-span-2" />
        </div>
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
        <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
        <p className="mt-1 text-text-secondary">
          {scope.level === 'all' ? 'Organization-wide' : scope.level === 'organization' ? 'Organization' : 'Team'} AI collaboration metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="Corrix Score"
          score={summary?.averageCorrixScore || 0}
          change={summary?.scoreChange7d || 0}
          subtitle="Average score"
        />
        <StatCard
          title="Active Users"
          value={summary?.activeUsers || 0}
          subtitle="Last 7 days"
          icon="👥"
          trend={
            summary?.activeUsers && summary?.totalUsers
              ? {
                  value: (summary.activeUsers / summary.totalUsers) * 100,
                  direction: 'stable',
                }
              : undefined
          }
        />
        <StatCard
          title="Total Teams"
          value={summary?.totalTeams || 0}
          subtitle="Across scope"
          icon="🏢"
        />
        <StatCard
          title="Total Users"
          value={summary?.totalUsers || 0}
          subtitle="All time"
          icon="👤"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {distribution && <ScoreDistributionChart data={distribution} height={220} />}
        {trend && <TrendChart data={trend} height={220} />}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {threeRs && <ThreeRsChart data={threeRs} height={280} />}

        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Top Performing Teams</h3>
          {topTeams.length === 0 ? (
            <p className="text-text-muted text-sm">No team data available</p>
          ) : (
            <div className="space-y-3">
              {topTeams.map((team) => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <span className="text-accent font-semibold">{team.teamName[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{team.teamName}</p>
                      <p className="text-xs text-text-muted">{team.userCount} users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold ${
                        team.corrixScore >= 70
                          ? 'text-score-high'
                          : team.corrixScore >= 40
                          ? 'text-score-medium'
                          : 'text-score-low'
                      }`}
                    >
                      {Math.round(team.corrixScore)}
                    </span>
                    <span
                      className={
                        team.trend === 'up'
                          ? 'text-score-high'
                          : team.trend === 'down'
                          ? 'text-score-low'
                          : 'text-text-muted'
                      }
                    >
                      {team.trend === 'up' ? '↑' : team.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
