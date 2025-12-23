import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DepartmentComparison } from '@corrix/shared';

interface DepartmentComparisonChartProps {
  data: DepartmentComparison;
  onDepartmentClick?: (departmentId: string) => void;
}

export function DepartmentComparisonChart({ data, onDepartmentClick }: DepartmentComparisonChartProps) {
  const chartData = data.ranking.map((dept) => ({
    id: dept.departmentId,
    name: dept.departmentName,
    score: dept.score,
    trend: dept.trend,
  }));

  const getBarColor = (score: number) => {
    if (score >= 70) return '#22c55e'; // score-high
    if (score >= 50) return '#eab308'; // score-medium
    return '#ef4444'; // score-low
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-secondary">Department Comparison</h3>
          <p className="text-xs text-text-muted mt-1">
            {data.departments.length} departments
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(200, data.ranking.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#252b3d',
              border: '1px solid #343a4d',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [value.toFixed(1), 'Corrix Score']}
          />
          <Bar
            dataKey="score"
            radius={[0, 4, 4, 0]}
            onClick={(data) => onDepartmentClick?.(data.id)}
            cursor="pointer"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Highlights */}
      <div className="mt-4 pt-4 border-t border-border-default grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-text-muted">Top Performing</p>
          <p className="text-sm font-medium text-score-high truncate">
            {data.topPerforming?.departmentName || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Most Improved</p>
          <p className="text-sm font-medium text-accent-primary truncate">
            {data.mostImproved?.departmentName || '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Needs Attention</p>
          <p className="text-sm font-medium text-score-low truncate">
            {data.needsAttention?.[0]?.departmentName || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
