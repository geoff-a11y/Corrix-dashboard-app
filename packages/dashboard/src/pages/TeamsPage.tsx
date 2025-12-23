import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { teamsApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { Skeleton } from '@/components';
import type { TeamAnalytics } from '@corrix/shared';

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

export function TeamsPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamAnalytics[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'users'>('score');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const data = await teamsApi.getComparison({
          organizationId: scope.organizationId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        setTeams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, dateRange]);

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
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-5 w-56" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="text-center mb-4">
                <Skeleton className="h-10 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-score-low mb-2">Error loading teams</p>
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
          <h1 className="text-2xl font-bold text-text-primary">Teams</h1>
          <p className="mt-1 text-text-secondary">
            Compare and analyze team performance
          </p>
        </div>
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
            <button
              onClick={() => setSelectedTeams([])}
              className="btn btn-secondary"
            >
              Clear ({selectedTeams.length})
            </button>
          )}
        </div>
      </div>

      {/* Teams Grid */}
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
                    <div className={clsx('text-sm font-semibold', getScoreColor(team.scores.threeRs.results.mean))}>
                      {Math.round(team.scores.threeRs.results.mean)}
                    </div>
                    <div className="text-xs text-text-muted">R</div>
                  </div>
                  <div className="text-center">
                    <div className={clsx('text-sm font-semibold', getScoreColor(team.scores.threeRs.relationship.mean))}>
                      {Math.round(team.scores.threeRs.relationship.mean)}
                    </div>
                    <div className="text-xs text-text-muted">R</div>
                  </div>
                  <div className="text-center">
                    <div className={clsx('text-sm font-semibold', getScoreColor(team.scores.threeRs.resilience.mean))}>
                      {Math.round(team.scores.threeRs.resilience.mean)}
                    </div>
                    <div className="text-xs text-text-muted">R</div>
                  </div>
                </div>
              </div>
            );
          })}
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
                      <td className={clsx('py-3 font-semibold', getScoreColor(team.scores.corrixScore.mean))}>
                        {Math.round(team.scores.corrixScore.mean)}
                      </td>
                      <td className={clsx('py-3', getScoreColor(team.scores.threeRs.results.mean))}>
                        {Math.round(team.scores.threeRs.results.mean)}
                      </td>
                      <td className={clsx('py-3', getScoreColor(team.scores.threeRs.relationship.mean))}>
                        {Math.round(team.scores.threeRs.relationship.mean)}
                      </td>
                      <td className={clsx('py-3', getScoreColor(team.scores.threeRs.resilience.mean))}>
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
  );
}
