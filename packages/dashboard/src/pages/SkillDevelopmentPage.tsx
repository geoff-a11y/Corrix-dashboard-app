import { useEffect, useState } from 'react';
import { skillsApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import { SkillTrajectoryChart } from '@/components/charts/SkillTrajectoryChart';
import { VelocityLeaderboard } from '@/components/charts/VelocityLeaderboard';
import { GapAnalysisChart } from '@/components/charts/GapAnalysisChart';
import { CompetencyTimeline } from '@/components/charts/CompetencyTimeline';
import type { SkillTrajectory, LearningVelocity, SkillGapAnalysis, TimeToCompetencyMetrics, VelocityPeriod } from '@corrix/shared';

export function SkillDevelopmentPage() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [velocityPeriod, setVelocityPeriod] = useState<VelocityPeriod>('30d');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LearningVelocity[]>([]);
  const [timeToCompetency, setTimeToCompetency] = useState<TimeToCompetencyMetrics | null>(null);
  const [trajectory, setTrajectory] = useState<SkillTrajectory | null>(null);
  const [gaps, setGaps] = useState<SkillGapAnalysis | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [leaderboardData, ttcData] = await Promise.all([
          skillsApi.getVelocityLeaderboard({
            organizationId: scope.organizationId,
            teamId: scope.level === 'team' ? scope.teamId : undefined,
            userId: scope.userId,
            limit: 20,
            period: velocityPeriod,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
          skillsApi.getTimeToCompetency({
            organizationId: scope.organizationId,
            teamId: scope.level === 'team' ? scope.teamId : undefined,
            userId: scope.userId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }),
        ]);

        setLeaderboard(leaderboardData);
        setTimeToCompetency(ttcData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scope, velocityPeriod, dateRange]);

  useEffect(() => {
    if (!selectedUserId) {
      setTrajectory(null);
      setGaps(null);
      return;
    }

    async function fetchUserData() {
      if (!selectedUserId) return;
      try {
        const [trajectoryData, gapsData] = await Promise.all([
          skillsApi.getTrajectory(selectedUserId, 90),
          skillsApi.getSkillGaps(selectedUserId),
        ]);

        setTrajectory(trajectoryData);
        setGaps(gapsData);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    }

    fetchUserData();
  }, [selectedUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading skill development data...</div>
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
        <h1 className="text-2xl font-bold text-text-primary">Skill Development</h1>
        <p className="mt-1 text-text-secondary">
          Track skill trajectories, learning velocity, and competency milestones
        </p>
      </div>

      {/* Time to Competency Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Time to Competency</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted">Median days to reach competency</p>
              <p className="text-3xl font-bold text-accent-primary">
                {timeToCompetency?.population.median.toFixed(0) || '—'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">25th percentile</p>
                <p className="font-medium text-text-primary">{timeToCompetency?.population.p25.toFixed(0) || '—'} days</p>
              </div>
              <div>
                <p className="text-text-muted">75th percentile</p>
                <p className="font-medium text-text-primary">{timeToCompetency?.population.p75.toFixed(0) || '—'} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {timeToCompetency && <CompetencyTimeline data={timeToCompetency.milestones} />}
        </div>
      </div>

      {/* Velocity Leaderboard and Individual Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-text-secondary">Fastest Learners</h3>
            <select
              value={velocityPeriod}
              onChange={(e) => setVelocityPeriod(e.target.value as VelocityPeriod)}
              className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary"
            >
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <VelocityLeaderboard
            data={leaderboard}
            period={velocityPeriod}
            highlightUserId={selectedUserId || undefined}
            onUserSelect={setSelectedUserId}
          />
        </div>

        {/* Individual Analysis */}
        <div className="space-y-6">
          {selectedUserId && trajectory ? (
            <>
              <SkillTrajectoryChart
                data={trajectory}
                showComponents={false}
                showProjection={true}
              />
              {gaps && <GapAnalysisChart data={gaps} />}
            </>
          ) : (
            <div className="card h-[400px] flex items-center justify-center">
              <p className="text-text-muted text-center">
                Select a user from the leaderboard<br />
                to view their skill trajectory and gap analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
