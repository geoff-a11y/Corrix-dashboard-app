import { useEffect, useState } from 'react';
import { ScoreCard, StatCard, TrendChart, SkeletonCard, SkeletonChart } from '@/components';
import { scoresApi, organizationsApi, teamsApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import type { ScoreTrend, TeamRankingEntry } from '@corrix/shared';
import { clsx } from 'clsx';

interface OrgSummary {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  averageCorrixScore: number;
  scoreChange7d: number;
  scoreChange30d: number;
}

// TODO: Replace with actual alertsApi when available
interface Alert {
  id: string;
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  teamName?: string;
  timestamp: string;
}

interface AlertsSummary {
  critical: number;
  warning: number;
}

interface AlertsResponse {
  alerts: Alert[];
  summary: AlertsSummary;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// Mock alerts API - TODO: Replace with actual API
const mockAlertsApi = {
  async getAlerts(params: { organizationId?: string; teamId?: string; teamName?: string; limit?: number }): Promise<AlertsResponse> {
    // When viewing a specific team, return team-specific alerts (or empty for real data teams)
    if (params.teamId) {
      // For real data teams like Corrix Beta, return empty alerts
      // In production, this would query actual alert data
      return {
        alerts: [],
        summary: { critical: 0, warning: 0 },
      };
    }

    // Organization-wide mock alerts
    return {
      alerts: [
        {
          id: '1',
          severity: 'critical',
          title: 'Team Performance Declining',
          description: 'Engineering team score dropped 15 points in the last 7 days',
          teamName: 'Engineering',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          severity: 'warning',
          title: 'Low Relationship Score',
          description: 'Marketing team relationship dimension below threshold',
          teamName: 'Marketing',
          timestamp: new Date().toISOString(),
        },
      ],
      summary: {
        critical: 1,
        warning: 1,
      },
    };
  },

  async getRecommendations(params: { organizationId?: string; teamId?: string; limit?: number }): Promise<Recommendation[]> {
    // When viewing a specific team, return team-specific recommendations
    if (params.teamId) {
      return [
        {
          id: '1',
          title: 'Review Team Trends',
          description: 'Monitor daily score patterns to identify improvement opportunities',
          impact: 'medium',
        },
      ];
    }

    return [
      {
        id: '1',
        title: 'Improve Team Collaboration',
        description: 'Schedule regular sync meetings for Engineering team to improve relationship scores',
        impact: 'high',
      },
      {
        id: '2',
        title: 'Review Prompt Quality',
        description: 'Teams with lower scores are using less specific prompts',
        impact: 'medium',
      },
      {
        id: '3',
        title: 'Increase AI Tool Adoption',
        description: 'Only 60% of users active in the last 7 days',
        impact: 'medium',
      },
    ];
  },
};

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <div
      className={clsx(
        'p-3 rounded-lg border mb-2 last:mb-0',
        alert.severity === 'critical'
          ? 'border-score-low bg-score-low/5'
          : 'border-score-medium bg-score-medium/5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {alert.teamName && (
              <span className="text-xs font-medium text-text-muted">{alert.teamName}</span>
            )}
          </div>
          <h4 className="text-sm font-medium text-text-primary mb-1">{alert.title}</h4>
          <p className="text-xs text-text-secondary">{alert.description}</p>
        </div>
        <span
          className={clsx(
            'text-xs px-2 py-1 rounded font-medium whitespace-nowrap',
            alert.severity === 'critical'
              ? 'bg-score-low/20 text-score-low'
              : 'bg-score-medium/20 text-score-medium'
          )}
        >
          {alert.severity}
        </span>
      </div>
    </div>
  );
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="p-3 rounded-lg bg-bg-secondary hover:bg-bg-secondary/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text-primary mb-1">{recommendation.title}</h4>
          <p className="text-xs text-text-secondary">{recommendation.description}</p>
        </div>
        <span
          className={clsx(
            'text-xs px-2 py-1 rounded font-medium whitespace-nowrap',
            recommendation.impact === 'high' && 'bg-accent/20 text-accent',
            recommendation.impact === 'medium' && 'bg-score-medium/20 text-score-medium',
            recommendation.impact === 'low' && 'bg-bg-tertiary text-text-muted'
          )}
        >
          {recommendation.impact}
        </span>
      </div>
    </div>
  );
}

export function HomePage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [summary, setSummary] = useState<OrgSummary | null>(null);
  const [trend, setTrend] = useState<ScoreTrend | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [topTeam, setTopTeam] = useState<TeamRankingEntry | null>(null);

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
        // Fetch summary data based on scope level
        let summaryPromise: Promise<OrgSummary>;
        if (scope.level === 'team' && scope.teamId) {
          // Fetch team-specific summary using getTeamAnalytics
          summaryPromise = teamsApi.getTeamAnalytics(scope.teamId).then(teamData => ({
            totalUsers: teamData.userCount || 0,
            activeUsers: teamData.activeUserCount || teamData.userCount || 0,
            totalTeams: 1,
            averageCorrixScore: teamData.scores?.corrixScore?.mean || 0,
            scoreChange7d: 0, // TODO: Calculate from trends if needed
            scoreChange30d: 0,
          })).catch(() => ({ totalUsers: 0, activeUsers: 0, totalTeams: 1, averageCorrixScore: 0, scoreChange7d: 0, scoreChange30d: 0 }));
        } else if (scope.organizationId) {
          summaryPromise = organizationsApi.getSummary(scope.organizationId);
        } else {
          summaryPromise = Promise.resolve({ totalUsers: 0, activeUsers: 0, totalTeams: 0, averageCorrixScore: 0, scoreChange7d: 0, scoreChange30d: 0 });
        }

        const [alertsData, summaryData, trendData, recommendationsData, teamsData] = await Promise.all([
          mockAlertsApi.getAlerts({
            organizationId: scope.organizationId,
            teamId: scope.level === 'team' ? scope.teamId : undefined,
            limit: 5,
          }),
          summaryPromise,
          scoresApi.getTrends({
            ...params,
            metric: 'corrix',
            period: 'day',
            duration: 30,
          }),
          mockAlertsApi.getRecommendations({
            organizationId: scope.organizationId,
            teamId: scope.level === 'team' ? scope.teamId : undefined,
            limit: 5,
          }),
          scope.level === 'team'
            ? Promise.resolve([]) // Don't show "top team" when viewing a specific team
            : scope.organizationId
              ? teamsApi.getRanking({ organizationId: scope.organizationId, limit: 1 })
              : Promise.resolve([]),
        ]);

        setAlerts(alertsData);
        setSummary(summaryData);
        setTrend(trendData);
        setRecommendations(recommendationsData);
        setTopTeam(teamsData[0] || null);
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
        <div className="h-32 bg-bg-tertiary rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonChart height={280} />
        <div className="h-48 bg-bg-tertiary rounded animate-pulse" />
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
        <h1 className="text-2xl font-bold text-text-primary">Home</h1>
        <p className="mt-1 text-text-secondary">
          Your AI collaboration dashboard overview
        </p>
      </div>

      {/* Alert Panel */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="card bg-bg-secondary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <span className={alerts.summary.critical > 0 ? 'text-score-low' : 'text-score-medium'}>
                {alerts.summary.critical > 0 ? '🔴' : '🟡'}
              </span>
              {alerts.alerts.length} Issue{alerts.alerts.length !== 1 ? 's' : ''} Needing Attention
            </h3>
            <span className="text-xs text-text-muted">
              {alerts.summary.critical} critical, {alerts.summary.warning} warning
            </span>
          </div>
          {alerts.alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}

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
        {topTeam ? (
          <div className="card">
            <p className="text-sm text-text-secondary font-medium mb-2">Top Team</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <span className="text-accent font-semibold text-sm">{topTeam.teamName[0]}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary text-sm">{topTeam.teamName}</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span
                className={clsx(
                  'text-2xl font-bold tabular-nums',
                  topTeam.corrixScore >= 70
                    ? 'text-score-high'
                    : topTeam.corrixScore >= 40
                    ? 'text-score-medium'
                    : 'text-score-low'
                )}
              >
                {Math.round(topTeam.corrixScore)}
              </span>
              <span className="text-xs text-text-muted mb-1">{topTeam.userCount} users</span>
            </div>
          </div>
        ) : (
          <StatCard
            title="Total Teams"
            value={summary?.totalTeams || 0}
            subtitle="Across scope"
            icon="🏢"
          />
        )}
        <StatCard
          title="30-Day Trend"
          value={summary?.scoreChange30d ? `${summary.scoreChange30d > 0 ? '+' : ''}${summary.scoreChange30d.toFixed(1)}` : '0'}
          subtitle="Score change"
          icon="📈"
          trend={
            summary?.scoreChange30d
              ? {
                  value: Math.abs(summary.scoreChange30d),
                  direction: summary.scoreChange30d > 0 ? 'up' : summary.scoreChange30d < 0 ? 'down' : 'stable',
                }
              : undefined
          }
        />
      </div>

      {/* Score Trend Chart */}
      {trend && (
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-4">30-Day Score Trend</h3>
          <TrendChart data={trend} height={280} />
        </div>
      )}

      {/* Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Recommended Actions</h3>
          <div className="space-y-2">
            {recommendations.map((recommendation) => (
              <RecommendationItem key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
