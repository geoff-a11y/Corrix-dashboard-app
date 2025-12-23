import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { ThreeRsScores } from '@corrix/shared';

interface ThreeRsChartProps {
  data: ThreeRsScores;
  height?: number;
}

export function ThreeRsChart({ data, height = 250 }: ThreeRsChartProps) {
  const chartData = [
    { dimension: 'Results', value: data.results, fullMark: 100 },
    { dimension: 'Relationship', value: data.relationship, fullMark: 100 },
    { dimension: 'Resilience', value: data.resilience, fullMark: 100 },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">3Rs Balance</h3>

      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#343a4d" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#a0a8c0', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#252b3d',
              border: '1px solid #343a4d',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [value.toFixed(1), 'Score']}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#5b4cdb"
            fill="#5b4cdb"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend with values */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        {chartData.map((item) => (
          <div key={item.dimension} className="text-center">
            <p className="text-xs text-text-muted">{item.dimension}</p>
            <p className="text-lg font-semibold text-text-primary">{item.value.toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
