import { useEffect, useState } from 'react';
import { scoresApi } from '@/api';
import { useScope } from '@/contexts/ScopeContext';
import { useDateRange } from '@/contexts/DateRangeContext';
import type { ThreeRsTimePatterns, ThreeRsWithSampleSize, ThreeRsTimeInsight } from '@corrix/shared';

const METRIC_COLORS = {
  results: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  relationship: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
  resilience: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
};

const PERIOD_LABELS = {
  morning: 'Morning (6am-12pm)',
  afternoon: 'Afternoon (12pm-6pm)',
  evening: 'Evening (6pm-12am)',
};

function ScoreBar({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const width = Math.min((score / maxScore) * 100, 100);
  const color = score >= 70 ? 'bg-score-high' : score >= 50 ? 'bg-score-medium' : 'bg-score-low';

  return (
    <div className="flex items-center gap-2">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-sm font-medium text-text-primary w-8">{score}</span>
    </div>
  );
}

function InsightCard({ insight }: { insight: ThreeRsTimeInsight }) {
  const colors = METRIC_COLORS[insight.metric];

  return (
    <div className={`p-4 rounded-lg ${colors.bg} border border-${colors.text}/20`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">💡</span>
        <div>
          <p className={`font-medium ${colors.text}`}>{insight.insight}</p>
          <p className="text-sm text-gray-600 mt-1">{insight.actionable}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Best: {insight.bestTime}</span>
            <span>Gap: +{insight.difference} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayPartTable({ data }: { data: { morning: ThreeRsWithSampleSize; afternoon: ThreeRsWithSampleSize; evening: ThreeRsWithSampleSize } }) {
  const periods = ['morning', 'afternoon', 'evening'] as const;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 font-medium text-text-secondary">Period</th>
          <th className="text-center py-2 font-medium text-blue-600">Results</th>
          <th className="text-center py-2 font-medium text-green-600">Relationship</th>
          <th className="text-center py-2 font-medium text-purple-600">Resilience</th>
          <th className="text-right py-2 font-medium text-text-muted">n</th>
        </tr>
      </thead>
      <tbody>
        {periods.map(period => {
          const scores = data[period];
          if (scores.sampleSize < 1) return null;

          return (
            <tr key={period} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 font-medium text-text-primary">{PERIOD_LABELS[period]}</td>
              <td className="py-3"><ScoreBar score={scores.results} /></td>
              <td className="py-3"><ScoreBar score={scores.relationship} /></td>
              <td className="py-3"><ScoreBar score={scores.resilience} /></td>
              <td className="py-3 text-right text-text-muted">{scores.sampleSize}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DayOfWeekTable({ data }: { data: Record<string, ThreeRsWithSampleSize> }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 font-medium text-text-secondary">Day</th>
          <th className="text-center py-2 font-medium text-blue-600">Results</th>
          <th className="text-center py-2 font-medium text-green-600">Relationship</th>
          <th className="text-center py-2 font-medium text-purple-600">Resilience</th>
          <th className="text-right py-2 font-medium text-text-muted">n</th>
        </tr>
      </thead>
      <tbody>
        {days.map(day => {
          const scores = data[day];
          if (!scores || scores.sampleSize < 1) return null;

          return (
            <tr key={day} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 font-medium text-text-primary">{day}</td>
              <td className="py-3"><ScoreBar score={scores.results} /></td>
              <td className="py-3"><ScoreBar score={scores.relationship} /></td>
              <td className="py-3"><ScoreBar score={scores.resilience} /></td>
              <td className="py-3 text-right text-text-muted">{scores.sampleSize}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function ThreeRsTimePatternsChart() {
  const { scope } = useScope();
  const { dateRange } = useDateRange();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ThreeRsTimePatterns | null>(null);
  const [activeTab, setActiveTab] = useState<'dayPart' | 'dayOfWeek'>('dayPart');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const patterns = await scoresApi.getTimePatterns({
          organizationId: scope.organizationId,
          teamId: scope.level === 'team' ? scope.teamId : undefined,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        setData(patterns);
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
      <div className="card">
        <div className="flex items-center justify-center h-48">
          <div className="text-text-secondary">Loading 3R time patterns...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-score-low mb-2">Error loading data</p>
            <p className="text-sm text-text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.summary.hasEnoughData) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-text-primary mb-2">3R Time Patterns</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-text-muted">Not enough data yet. Need at least 5 sessions to analyze patterns.</p>
        </div>
      </div>
    );
  }

  const allInsights = [
    ...(data.byDayPart?.insights || []),
    ...(data.byDayOfWeek?.insights || []),
  ];

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-text-primary">3R Time Patterns</h3>
          <p className="text-sm text-text-muted mt-1">
            How your Results, Relationship, and Resilience scores vary by time
          </p>
        </div>
        <div className="text-xs text-text-muted">
          {data.summary.totalSessions} sessions analyzed
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('dayPart')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'dayPart'
              ? 'bg-accent-primary text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          By Time of Day
        </button>
        <button
          onClick={() => setActiveTab('dayOfWeek')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'dayOfWeek'
              ? 'bg-accent-primary text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          By Day of Week
        </button>
      </div>

      {/* Content */}
      <div className="mb-6">
        {activeTab === 'dayPart' && data.byDayPart && (
          <DayPartTable data={data.byDayPart} />
        )}
        {activeTab === 'dayOfWeek' && data.byDayOfWeek && (
          <DayOfWeekTable data={data.byDayOfWeek.scores} />
        )}
        {activeTab === 'dayPart' && !data.byDayPart && (
          <div className="text-center py-8 text-text-muted">
            Not enough data to analyze time-of-day patterns
          </div>
        )}
        {activeTab === 'dayOfWeek' && !data.byDayOfWeek && (
          <div className="text-center py-8 text-text-muted">
            Not enough data to analyze day-of-week patterns
          </div>
        )}
      </div>

      {/* Insights */}
      {allInsights.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3">Key Insights</h4>
          <div className="space-y-3">
            {allInsights.slice(0, 3).map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
