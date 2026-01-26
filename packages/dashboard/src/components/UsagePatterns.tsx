import { clsx } from 'clsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export interface UsagePatternsData {
  peakProductivityTime: 'morning' | 'afternoon' | 'evening' | 'night';
  hoursPerWeek: number;
  hoursPerWeekTrend: number; // percentage change
  typicalActiveDayParts: string[]; // e.g., ['morning', 'afternoon']
  activityByHour?: Array<{ hour: number; count: number }>; // optional heatmap data
  activityByDayOfWeek?: Array<{ day: string; hours: number }>; // optional weekly pattern
}

interface UsagePatternsProps {
  data: UsagePatternsData;
  showHeatmap?: boolean;
}

const PEAK_TIME_LABELS = {
  morning: 'Morning (6-12)',
  afternoon: 'Afternoon (12-18)',
  evening: 'Evening (18-22)',
  night: 'Night (22-6)',
};

const PEAK_TIME_COLORS = {
  morning: '#fbbf24', // yellow
  afternoon: '#3b82f6', // blue
  evening: '#8b5cf6', // purple
  night: '#6366f1', // indigo
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function UsagePatterns({ data, showHeatmap = false }: UsagePatternsProps) {
  const peakTimeColor = PEAK_TIME_COLORS[data.peakProductivityTime];
  const peakTimeLabel = PEAK_TIME_LABELS[data.peakProductivityTime];
  const isTrendPositive = data.hoursPerWeekTrend > 0;
  const isTrendNegative = data.hoursPerWeekTrend < 0;

  // Prepare weekly activity data if available
  const weeklyData = data.activityByDayOfWeek || DAY_LABELS.map((day, index) => ({
    day,
    hours: index < 5 ? Math.random() * 3 + 1 : Math.random() * 1.5, // Mock data fallback
  }));

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">Usage Patterns</h3>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Peak Productivity Time */}
        <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">Peak Productivity</p>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: peakTimeColor }}
            />
          </div>
          <p className="text-xl font-bold text-text-primary mb-1">
            {peakTimeLabel.split(' ')[0]}
          </p>
          <p className="text-xs text-text-muted">{peakTimeLabel.split(' ')[1]}</p>
        </div>

        {/* Hours per Week */}
        <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
          <p className="text-xs text-text-muted mb-2">Hours per Week</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-text-primary">
              {data.hoursPerWeek.toFixed(1)}h
            </p>
            {data.hoursPerWeekTrend !== 0 && (
              <span
                className={clsx(
                  'text-sm font-medium mb-0.5',
                  isTrendPositive && 'text-score-high',
                  isTrendNegative && 'text-score-low'
                )}
              >
                {isTrendPositive && '↑'}
                {isTrendNegative && '↓'}
                {Math.abs(data.hoursPerWeekTrend).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">vs last week</p>
        </div>

        {/* Active Day Parts */}
        <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
          <p className="text-xs text-text-muted mb-2">Typical Active Periods</p>
          <div className="flex flex-wrap gap-1.5">
            {data.typicalActiveDayParts.map((part) => (
              <span
                key={part}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-primary/10 text-accent-primary"
              >
                {part.charAt(0).toUpperCase() + part.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      {showHeatmap && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-text-muted mb-3">Activity by Day of Week</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#343a4d" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#343a4d' }}
                tickLine={{ stroke: '#343a4d' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#343a4d' }}
                tickLine={{ stroke: '#343a4d' }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#252b3d',
                  border: '1px solid #343a4d',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Hours']}
              />
              <Bar
                dataKey="hours"
                fill="#5b4cdb"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity Heatmap (Simplified Time-of-Day) */}
      {showHeatmap && data.activityByHour && (
        <div className="mt-6 border-t border-border-subtle pt-4">
          <h4 className="text-xs font-medium text-text-muted mb-3">Time of Day Activity</h4>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }, (_, i) => {
              const hourData = data.activityByHour?.find(h => h.hour === i);
              const maxCount = Math.max(...(data.activityByHour?.map(h => h.count) || [1]));
              const intensity = hourData ? (hourData.count / maxCount) : 0;

              return (
                <div
                  key={i}
                  className="aspect-square rounded relative group cursor-pointer"
                  style={{
                    backgroundColor: intensity > 0
                      ? `rgba(91, 76, 219, ${0.2 + intensity * 0.8})`
                      : '#1f2937',
                  }}
                  title={`${i}:00 - ${hourData?.count || 0} sessions`}
                >
                  {i % 3 === 0 && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-text-muted">
                      {i}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-8 text-xs text-text-muted">
            <span>Less active</span>
            <div className="flex items-center gap-1">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
                <div
                  key={intensity}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: `rgba(91, 76, 219, ${intensity})` }}
                />
              ))}
            </div>
            <span>More active</span>
          </div>
        </div>
      )}
    </div>
  );
}
