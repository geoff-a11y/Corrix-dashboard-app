import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  effectivenessRate: number;
  dismissalRate: number;
  totalShown: number;
}

interface Props {
  data: TrendDataPoint[];
  height?: number;
}

export function CoachingTrendChart({ data, height = 250 }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted">
        No trend data available. Select a coaching type to see its trend.
      </div>
    );
  }

  // Transform data for display (convert rates to percentages)
  const chartData = data.map(point => ({
    ...point,
    effectiveness: point.effectivenessRate * 100,
    dismissal: point.dismissalRate * 100,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#343a4d"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#252b3d',
              border: '1px solid #343a4d',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            }}
            formatter={(value: number, name: string) => {
              const displayName = name === 'effectiveness' ? 'Effectiveness' : 'Dismissal';
              return [`${value.toFixed(1)}%`, displayName];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            formatter={(value) => (
              <span className="text-text-secondary">
                {value === 'effectiveness' ? 'Effectiveness Rate' : 'Dismissal Rate'}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="effectiveness"
            name="effectiveness"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
            activeDot={{ r: 5, fill: '#22c55e' }}
          />
          <Line
            type="monotone"
            dataKey="dismissal"
            name="dismissal"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 3 }}
            activeDot={{ r: 5, fill: '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary below chart */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <p className="text-xs text-text-muted">Total Shown</p>
          <p className="text-lg font-semibold text-text-primary">
            {data.reduce((sum, d) => sum + d.totalShown, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted">Avg Effectiveness</p>
          <p className="text-lg font-semibold text-score-high">
            {(
              data.reduce((sum, d) => sum + d.effectivenessRate, 0) / data.length * 100
            ).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted">Avg Dismissal</p>
          <p className="text-lg font-semibold text-score-low">
            {(
              data.reduce((sum, d) => sum + d.dismissalRate, 0) / data.length * 100
            ).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-text-muted">Data Points</p>
          <p className="text-lg font-semibold text-text-primary">{data.length}</p>
        </div>
      </div>
    </div>
  );
}
