import type { SkillGapAnalysis } from '@corrix/shared';
import { clsx } from 'clsx';

interface GapAnalysisChartProps {
  data: SkillGapAnalysis;
}

export function GapAnalysisChart({ data }: GapAnalysisChartProps) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-secondary">Skill Gap Analysis</h3>
          <p className="text-xs text-text-muted mt-1">
            Overall Progress: {data.overallProgress.toFixed(0)}%
          </p>
        </div>
        {data.estimatedDaysToCompetency && (
          <div className="text-right">
            <p className="text-lg font-bold text-text-primary">{data.estimatedDaysToCompetency}</p>
            <p className="text-xs text-text-muted">Days to target</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {data.prioritizedGaps.map((gap) => (
          <div key={gap.skillName} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{gap.displayName}</span>
                <PriorityBadge priority={gap.priority} />
              </div>
              <div className="text-xs text-text-muted">
                {gap.currentValue.toFixed(0)} / {gap.targetValue.toFixed(0)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden">
              {/* Current value */}
              <div
                className={clsx(
                  'absolute h-full rounded-full transition-all',
                  gap.gap <= 5 ? 'bg-score-high' :
                  gap.gap <= 15 ? 'bg-score-medium' : 'bg-score-low'
                )}
                style={{ width: `${(gap.currentValue / gap.targetValue) * 100}%` }}
              />
              {/* Target marker */}
              <div
                className="absolute h-3 w-0.5 bg-text-muted -top-0.5"
                style={{ left: '100%' }}
              />
            </div>

            {/* Gap details */}
            <div className="flex justify-between text-xs text-text-muted">
              <span>Gap: {gap.gap.toFixed(1)} pts ({gap.gapPercentage.toFixed(0)}%)</span>
              {gap.estimatedDaysToClose && (
                <span>~{gap.estimatedDaysToClose} days to close</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {data.prioritizedGaps.length > 0 && data.prioritizedGaps[0].recommendations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border-default">
          <h4 className="text-xs font-medium text-text-secondary mb-2">Top Recommendations</h4>
          <ul className="space-y-1">
            {data.prioritizedGaps[0].recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                <span className="text-accent-primary">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { bg: 'bg-score-low/10', text: 'text-score-low' },
    medium: { bg: 'bg-score-medium/10', text: 'text-score-medium' },
    low: { bg: 'bg-score-high/10', text: 'text-score-high' },
  };

  const { bg, text } = config[priority];

  return (
    <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', bg, text)}>
      {priority}
    </span>
  );
}
