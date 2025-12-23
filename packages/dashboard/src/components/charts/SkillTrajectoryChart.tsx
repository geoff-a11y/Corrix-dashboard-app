import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import type { SkillTrajectory } from '@corrix/shared';

interface SkillTrajectoryChartProps {
  data: SkillTrajectory;
  height?: number;
  showComponents?: boolean;
  showProjection?: boolean;
}

export function SkillTrajectoryChart({
  data,
  height = 280,
  showComponents = false,
  showProjection = true,
}: SkillTrajectoryChartProps) {
  // Prepare chart data
  const chartData = data.points.map(point => ({
    date: point.date,
    overall: point.overallScore,
    promptEngineering: point.components.promptEngineering,
    outputEvaluation: point.components.outputEvaluation,
    verification: point.components.verification,
    iteration: point.components.iteration,
    adaptation: point.components.adaptation,
    criticalThinking: point.components.criticalThinking,
  }));

  // Add projection point
  if (showProjection && data.projectedScore30d && chartData.length > 0) {
    const lastDate = new Date(data.points[data.points.length - 1].date);
    const projected30d = new Date(lastDate);
    projected30d.setDate(projected30d.getDate() + 30);

    chartData.push({
      date: projected30d.toISOString().split('T')[0],
      overall: data.projectedScore30d,
      projected: true,
    } as typeof chartData[0] & { projected: boolean });
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-secondary">Skill Development Trajectory</h3>
          <p className="text-xs text-text-muted mt-1">
            {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(1)} points
            ({data.improvementRate.toFixed(2)}/week)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-accent-primary">{data.currentScore.toFixed(0)}</div>
            <div className="text-xs text-text-muted">Current</div>
          </div>
          {showProjection && (
            <div className="text-right">
              <div className="text-2xl font-bold text-text-muted">{data.projectedScore30d.toFixed(0)}</div>
              <div className="text-xs text-text-muted">Projected (30d)</div>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
            domain={[0, 100]}
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
            formatter={(value: number, name: string) => [value.toFixed(1), name]}
          />

          {/* Competency threshold lines */}
          <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="5 5" strokeOpacity={0.5} />
          <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.5} />
          <ReferenceLine y={85} stroke="#6366f1" strokeDasharray="5 5" strokeOpacity={0.5} />

          {/* Main score line */}
          <Line
            type="monotone"
            dataKey="overall"
            stroke="#5b4cdb"
            strokeWidth={2}
            dot={{ r: 3, fill: '#5b4cdb' }}
            connectNulls
          />

          {/* Component lines if enabled */}
          {showComponents && (
            <>
              <Line type="monotone" dataKey="promptEngineering" stroke="#8b5cf6" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="verification" stroke="#06b6d4" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="criticalThinking" stroke="#f59e0b" strokeWidth={1} dot={false} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Milestones */}
      {data.milestones && data.milestones.length > 0 && (
        <div className="mt-4 border-t border-border-default pt-4">
          <h4 className="text-xs font-medium text-text-secondary mb-2">Milestones Achieved</h4>
          <div className="flex flex-wrap gap-2">
            {data.milestones.slice(0, 5).map((milestone, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-score-high/10 text-score-high"
              >
                {milestone.milestoneName.replace(/_/g, ' ')} — Day {milestone.daysSinceFirstUse}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
