import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { ScoreCard, ScoreDistributionChart, SkeletonChart, Skeleton, BaselineComparison, SubMetricsPanel } from '@/components';
import { SkillTrajectoryChart } from '@/components/charts/SkillTrajectoryChart';
import { scoresApi, teamsApi, usersApi, skillsApi, performanceApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import type { ScoreDistribution, TeamAnalytics, SkillTrajectory, BaselineComparisonResponse } from '@corrix/shared';
import type { UserListItem, UserSummary } from '@/api/users';

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-score-high';
  if (score >= 40) return 'text-score-medium';
  return 'text-score-low';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-score-high/20';
  if (score >= 40) return 'bg-score-medium/20';
  return 'bg-score-low/20';
}

// Mock sub-metrics data - In production, this would come from the API
function generateSubMetrics(score: number) {
  const variance = 5;
  return {
    results: {
      efficiency: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
      outputAccuracy: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
      decisionQuality: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
    },
    relationship: {
      dialogueQuality: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
      trustCalibration: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
      appropriatenessOfReliance: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
    },
    resilience: {
      skillTrajectory: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
      expertisePreservation: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
      cognitiveSustainability: Math.min(100, Math.max(0, score + (Math.random() * variance * 2 - variance))),
    },
  };
}

export function PerformancePage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [activeTab, setActiveTab] = useState<'organization' | 'teams' | 'individuals'>('organization');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Organization tab data
  const [distribution, setDistribution] = useState<ScoreDistribution | null>(null);
  const [topTeams, setTopTeams] = useState<TeamAnalytics[]>([]);
  const [bottomTeams, setBottomTeams] = useState<TeamAnalytics[]>([]);

  // Teams tab data
  const [teams, setTeams] = useState<TeamAnalytics[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'users'>('score');

  // Individuals tab data
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [userTrajectory, setUserTrajectory] = useState<SkillTrajectory | null>(null);

  // Baseline comparison data
  const [orgBaseline, setOrgBaseline] = useState<BaselineComparisonResponse | null>(null);
  const [teamBaselines, setTeamBaselines] = useState<Record<string, BaselineComparisonResponse>>({});
  const [userBaseline, setUserBaseline] = useState<BaselineComparisonResponse | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(false);

  // Fetch data based on active tab
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
        if (activeTab === 'organization') {
          const [distData, teamsData] = await Promise.all([
            scoresApi.getDistribution(params),
            scope.organizationId
              ? teamsApi.getComparison({
                  organizationId: scope.organizationId,
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                })
              : Promise.resolve([]),
          ]);

          setDistribution(distData);
          const sortedTeams = [...teamsData].sort(
            (a, b) => b.scores.corrixScore.mean - a.scores.corrixScore.mean
          );
          setTopTeams(sortedTeams.slice(0, 5));
          setBottomTeams(sortedTeams.slice(-5).reverse());
        } else if (activeTab === 'teams') {
          const teamsData = await teamsApi.getComparison({
            organizationId: scope.organizationId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          });
          setTeams(teamsData);
        } else if (activeTab === 'individuals') {
          const usersData = await usersApi.listUsers({
            organizationId: scope.organizationId,
            teamId: scope.level === 'team' ? scope.teamId : undefined,
          });
          setUsers(usersData);

          // Auto-select first user if none selected
          if (!selectedUserId && usersData.length > 0) {
            setSelectedUserId(usersData[0].id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, dateRange, activeTab]);

  // Fetch individual user data when user is selected
  useEffect(() => {
    if (activeTab !== 'individuals' || !selectedUserId) {
      setUserSummary(null);
      setUserTrajectory(null);
      setUserBaseline(null);
      return;
    }

    async function fetchUserData() {
      if (!selectedUserId) return;
      try {
        const [summary, trajectory, baseline] = await Promise.all([
          usersApi.getUserSummary(selectedUserId),
          skillsApi.getTrajectory(selectedUserId, 90),
          performanceApi.getBaselineComparison({ scope: 'individual', entityId: selectedUserId }),
        ]);
        setUserSummary(summary);
        setUserTrajectory(trajectory);
        setUserBaseline(baseline);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    }

    fetchUserData();
  }, [selectedUserId, activeTab]);

  // Fetch organization baseline
  useEffect(() => {
    if (activeTab !== 'organization' || !scope.organizationId) {
      setOrgBaseline(null);
      return;
    }

    async function fetchOrgBaseline() {
      if (!scope.organizationId) return;
      setBaselineLoading(true);
      try {
        const baseline = await performanceApi.getBaselineComparison({
          scope: 'organization',
          entityId: scope.organizationId,
        });
        setOrgBaseline(baseline);
      } catch (err) {
        console.error('Failed to load organization baseline:', err);
      } finally {
        setBaselineLoading(false);
      }
    }

    fetchOrgBaseline();
  }, [activeTab, scope.organizationId]);

  // Fetch team baselines when in teams tab
  useEffect(() => {
    if (activeTab !== 'teams' || teams.length === 0) {
      setTeamBaselines({});
      return;
    }

    async function fetchTeamBaselines() {
      setBaselineLoading(true);
      try {
        const baselines = await Promise.all(
          teams.map((team) =>
            performanceApi.getBaselineComparison({
              scope: 'team',
              entityId: team.teamId,
            })
          )
        );
        const baselinesMap: Record<string, BaselineComparisonResponse> = {};
        baselines.forEach((baseline) => {
          if (baseline) {
            baselinesMap[baseline.entityId] = baseline;
          }
        });
        setTeamBaselines(baselinesMap);
      } catch (err) {
        console.error('Failed to load team baselines:', err);
      } finally {
        setBaselineLoading(false);
      }
    }

    fetchTeamBaselines();
  }, [activeTab, teams]);

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'score') return b.scores.corrixScore.mean - a.scores.corrixScore.mean;
    if (sortBy === 'name') return a.teamName.localeCompare(b.teamName);
    return b.userCount - a.userCount;
  });

  const toggleTeam = (id: string) => {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={280} />
          <SkeletonChart height={280} />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Performance</h1>
          <p className="mt-1 text-text-secondary">
            Unified scores across organization, teams, and individuals
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {(['organization', 'teams', 'individuals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Organization View */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {/* Organization Baseline Comparison */}
          {orgBaseline && (
            <BaselineComparison
              scope="organization"
              entityId={orgBaseline.entityId}
              entityName={orgBaseline.entityName}
              baseline={orgBaseline.hasBaseline ? orgBaseline.baseline : null}
              current={orgBaseline.current}
              loading={baselineLoading}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {distribution && <ScoreDistributionChart data={distribution} height={280} />}

            <div className="card">
              <h3 className="text-sm font-medium text-text-secondary mb-4">
                Top Performing Teams
              </h3>
              {topTeams.length === 0 ? (
                <p className="text-text-muted text-sm">No team data available</p>
              ) : (
                <div className="space-y-2">
                  {topTeams.map((team, index) => (
                    <div
                      key={team.teamId}
                      className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-muted w-6">#{index + 1}</span>
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm',
                            getScoreBg(team.scores.corrixScore.mean),
                            getScoreColor(team.scores.corrixScore.mean)
                          )}
                        >
                          {team.teamName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{team.teamName}</p>
                          <p className="text-xs text-text-muted">{team.userCount} users</p>
                        </div>
                      </div>
                      <span
                        className={clsx('text-lg font-bold', getScoreColor(team.scores.corrixScore.mean))}
                      >
                        {Math.round(team.scores.corrixScore.mean)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {bottomTeams.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-text-secondary mb-4">
                Teams Needing Attention
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bottomTeams.map((team) => (
                  <div key={team.teamId} className="p-3 rounded-lg bg-bg-secondary">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm',
                          getScoreBg(team.scores.corrixScore.mean),
                          getScoreColor(team.scores.corrixScore.mean)
                        )}
                      >
                        {team.teamName[0]}
                      </div>
                      <p className="font-medium text-text-primary text-sm">{team.teamName}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted">{team.userCount} users</span>
                      <span
                        className={clsx('text-lg font-bold', getScoreColor(team.scores.corrixScore.mean))}
                      >
                        {Math.round(team.scores.corrixScore.mean)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams View */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Compare Teams</h2>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'users')}
                className="input"
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
                <option value="users">Sort by Users</option>
              </select>
              {selectedTeams.length > 0 && (
                <button onClick={() => setSelectedTeams([])} className="btn btn-secondary">
                  Clear ({selectedTeams.length})
                </button>
              )}
            </div>
          </div>

          {teams.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-text-muted">No teams found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedTeams.map((team) => {
                const score = team.scores.corrixScore.mean;
                return (
                  <div
                    key={team.teamId}
                    onClick={() => toggleTeam(team.teamId)}
                    className={clsx(
                      'card cursor-pointer transition-all',
                      selectedTeams.includes(team.teamId)
                        ? 'ring-2 ring-accent'
                        : 'hover:bg-bg-secondary/50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-lg flex items-center justify-center font-semibold',
                            getScoreBg(score),
                            getScoreColor(score)
                          )}
                        >
                          {team.teamName[0]}
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">{team.teamName}</h3>
                          <p className="text-xs text-text-muted">{team.userCount} users</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <span className={clsx('text-4xl font-bold', getScoreColor(score))}>
                        {Math.round(score)}
                      </span>
                      <p className="text-xs text-text-muted mt-1">Corrix Score</p>
                    </div>

                    {/* 3Rs Mini Chart */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                      <div className="text-center">
                        <div
                          className={clsx(
                            'text-sm font-semibold',
                            getScoreColor(team.scores.threeRs.results.mean)
                          )}
                        >
                          {Math.round(team.scores.threeRs.results.mean)}
                        </div>
                        <div className="text-xs text-text-muted">Results</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={clsx(
                            'text-sm font-semibold',
                            getScoreColor(team.scores.threeRs.relationship.mean)
                          )}
                        >
                          {Math.round(team.scores.threeRs.relationship.mean)}
                        </div>
                        <div className="text-xs text-text-muted">Relationship</div>
                      </div>
                      <div className="text-center">
                        <div
                          className={clsx(
                            'text-sm font-semibold',
                            getScoreColor(team.scores.threeRs.resilience.mean)
                          )}
                        >
                          {Math.round(team.scores.threeRs.resilience.mean)}
                        </div>
                        <div className="text-xs text-text-muted">Resilience</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Team Baseline Comparisons */}
          {selectedTeams.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Baseline Comparisons</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {selectedTeams.map((teamId) => {
                  const team = teams.find((t) => t.teamId === teamId);
                  const baseline = teamBaselines[teamId];
                  if (!team || !baseline) return null;
                  return (
                    <BaselineComparison
                      key={teamId}
                      scope="team"
                      entityId={baseline.entityId}
                      entityName={baseline.entityName}
                      baseline={baseline.hasBaseline ? baseline.baseline : null}
                      current={baseline.current}
                      loading={baselineLoading}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparison Panel */}
          {selectedTeams.length >= 2 && (
            <div className="card">
              <h3 className="text-lg font-medium text-text-primary mb-4">
                Comparing {selectedTeams.length} Teams
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-text-muted text-sm">
                      <th className="pb-3 font-medium">Team</th>
                      <th className="pb-3 font-medium">Corrix</th>
                      <th className="pb-3 font-medium">Results</th>
                      <th className="pb-3 font-medium">Relationship</th>
                      <th className="pb-3 font-medium">Resilience</th>
                      <th className="pb-3 font-medium">Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams
                      .filter((t) => selectedTeams.includes(t.teamId))
                      .map((team) => (
                        <tr key={team.teamId} className="border-t border-border">
                          <td className="py-3 font-medium text-text-primary">{team.teamName}</td>
                          <td
                            className={clsx(
                              'py-3 font-semibold',
                              getScoreColor(team.scores.corrixScore.mean)
                            )}
                          >
                            {Math.round(team.scores.corrixScore.mean)}
                          </td>
                          <td
                            className={clsx('py-3', getScoreColor(team.scores.threeRs.results.mean))}
                          >
                            {Math.round(team.scores.threeRs.results.mean)}
                          </td>
                          <td
                            className={clsx(
                              'py-3',
                              getScoreColor(team.scores.threeRs.relationship.mean)
                            )}
                          >
                            {Math.round(team.scores.threeRs.relationship.mean)}
                          </td>
                          <td
                            className={clsx(
                              'py-3',
                              getScoreColor(team.scores.threeRs.resilience.mean)
                            )}
                          >
                            {Math.round(team.scores.threeRs.resilience.mean)}
                          </td>
                          <td className="py-3 text-text-secondary">{team.userCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individuals View */}
      {activeTab === 'individuals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Individual Performance</h2>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input w-64"
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayId}
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && userSummary ? (
            <div className="space-y-6">
              {/* Individual Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {userSummary.latestScore && (
                  <>
                    <ScoreCard
                      title="Corrix Score"
                      score={userSummary.latestScore.corrixScore}
                      subtitle={userSummary.displayId}
                    />
                    <ScoreCard
                      title="Results"
                      score={userSummary.latestScore.results}
                      subtitle="3Rs Dimension"
                    />
                    <ScoreCard
                      title="Relationship"
                      score={userSummary.latestScore.relationship}
                      subtitle="3Rs Dimension"
                    />
                    <ScoreCard
                      title="Resilience"
                      score={userSummary.latestScore.resilience}
                      subtitle="3Rs Dimension"
                    />
                  </>
                )}
              </div>

              {/* Baseline Comparison for Individual */}
              {userBaseline && (
                <BaselineComparison
                  scope="individual"
                  entityId={userBaseline.entityId}
                  entityName={userBaseline.entityName}
                  baseline={userBaseline.hasBaseline ? userBaseline.baseline : null}
                  current={userBaseline.current}
                  loading={baselineLoading}
                />
              )}

              {/* Sub-Metrics Breakdown */}
              {userSummary.latestScore && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    3Rs Sub-Metrics Breakdown
                  </h3>
                  <div className="space-y-3">
                    <SubMetricsPanel
                      dimension="results"
                      dimensionScore={userSummary.latestScore.results}
                      subMetrics={generateSubMetrics(userSummary.latestScore.results)}
                    />
                    <SubMetricsPanel
                      dimension="relationship"
                      dimensionScore={userSummary.latestScore.relationship}
                      subMetrics={generateSubMetrics(userSummary.latestScore.relationship)}
                    />
                    <SubMetricsPanel
                      dimension="resilience"
                      dimensionScore={userSummary.latestScore.resilience}
                      subMetrics={generateSubMetrics(userSummary.latestScore.resilience)}
                    />
                  </div>
                </div>
              )}

              {/* Skill Trajectory */}
              {userTrajectory && (
                <SkillTrajectoryChart
                  data={userTrajectory}
                  showComponents={false}
                  showProjection={true}
                />
              )}
            </div>
          ) : (
            <div className="card h-64 flex items-center justify-center">
              <p className="text-text-muted">
                Select a user from the dropdown to view their performance
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
