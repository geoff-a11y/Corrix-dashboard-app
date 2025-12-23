import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ScoreDistribution } from '@corrix/shared';

interface ScoreDistributionChartProps {
  data: ScoreDistribution;
  height?: number;
}

function getBarColor(min: number): string {
  if (min >= 70) return '#22c55e';
  if (min >= 40) return '#eab308';
  return '#ef4444';
}

export function ScoreDistributionChart({ data, height = 200 }: ScoreDistributionChartProps) {
  const chartData = data.buckets.map((bucket) => ({
    range: `${bucket.min}-${bucket.max}`,
    count: bucket.count,
    percentage: bucket.percentage,
    min: bucket.min,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">Score Distribution</h3>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Mean: <span className="text-text-primary font-medium">{data.mean.toFixed(1)}</span></span>
          <span>Median: <span className="text-text-primary font-medium">{data.median.toFixed(1)}</span></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
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
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
          />
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.min)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Percentiles */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-5 gap-2 text-center">
        {Object.entries(data.percentiles).map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-text-muted uppercase">{key}</p>
            <p className="text-sm font-medium text-text-primary">{value.toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
