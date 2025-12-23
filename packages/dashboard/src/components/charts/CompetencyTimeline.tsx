import type { TimeToCompetencyMetrics } from '@corrix/shared';

interface CompetencyTimelineProps {
  data: TimeToCompetencyMetrics['milestones'];
}

export function CompetencyTimeline({ data }: CompetencyTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card h-full flex items-center justify-center">
        <p className="text-text-muted text-sm">No milestone data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">Competency Milestones</h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border-default" />

        <div className="space-y-6">
          {data.map((milestone) => (
            <div key={milestone.milestone} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 w-8 flex-shrink-0 flex justify-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    milestone.achievementRate > 50
                      ? 'border-score-high bg-score-high/20'
                      : 'border-border-default bg-bg-secondary'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {milestone.milestone.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-text-muted">
                      Score threshold: {milestone.threshold}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">
                      {milestone.medianDays.toFixed(0)} days
                    </p>
                    <p className="text-xs text-text-muted">median</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>{milestone.achievedCount} achieved</span>
                    <span>{milestone.achievementRate.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-primary rounded-full transition-all"
                      style={{ width: `${milestone.achievementRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
