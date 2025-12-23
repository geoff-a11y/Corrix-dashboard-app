import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ScoreTrend } from '@corrix/shared';
import { clsx } from 'clsx';

interface TrendChartProps {
  data: ScoreTrend;
  height?: number;
  showMovingAverage?: boolean;
}

export function TrendChart({ data, height = 200, showMovingAverage = true }: TrendChartProps) {
  const { points, change } = data;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary capitalize">
          {data.metric} Trend
        </h3>
        <div
          className={clsx(
            'flex items-center gap-1 text-sm font-medium',
            change.direction === 'up' && 'text-score-high',
            change.direction === 'down' && 'text-score-low',
            change.direction === 'stable' && 'text-text-muted'
          )}
        >
          {change.direction === 'up' && '↑'}
          {change.direction === 'down' && '↓'}
          {change.direction === 'stable' && '→'}
          <span>{change.absolute.toFixed(1)}</span>
          <span className="text-text-muted">({change.percentage.toFixed(1)}%)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            domain={['auto', 'auto']}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#252b3d',
              border: '1px solid #343a4d',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [
              value.toFixed(1),
              name === 'value' ? 'Score' : 'Moving Avg',
            ]}
          />
          <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={40} stroke="#eab308" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#5b4cdb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#5b4cdb' }}
          />
          {showMovingAverage && (
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke="#8b7cf7"
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
