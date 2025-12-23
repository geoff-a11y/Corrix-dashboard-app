import { clsx } from 'clsx';
import type { CoachingRecommendation, RecommendationAction } from '@corrix/shared';

interface Props {
  recommendations: CoachingRecommendation[];
}

const ACTION_DISPLAY: Record<RecommendationAction, { label: string; icon: string; color: string }> = {
  increase_frequency: {
    label: 'Increase Frequency',
    icon: '↑',
    color: 'text-score-high',
  },
  decrease_frequency: {
    label: 'Decrease Frequency',
    icon: '↓',
    color: 'text-score-mid',
  },
  restrict_to_expertise: {
    label: 'Restrict by Expertise',
    icon: '🎯',
    color: 'text-accent',
  },
  restrict_to_domain: {
    label: 'Restrict by Domain',
    icon: '📁',
    color: 'text-accent',
  },
  disable: {
    label: 'Consider Disabling',
    icon: '⏹',
    color: 'text-score-low',
  },
  monitor: {
    label: 'Monitor Closely',
    icon: '👀',
    color: 'text-score-mid',
  },
  expand_audience: {
    label: 'Expand Audience',
    icon: '↗',
    color: 'text-score-high',
  },
};

const COACHING_TYPE_NAMES: Record<string, string> = {
  hallucination_risk: 'Hallucination Risk',
  refusal_recovery: 'Refusal Recovery',
  stop_ramble: 'Stop Ramble',
  math_date_check: 'Math/Date Check',
  contradictory_instructions: 'Contradictory Instructions',
  action_extraction: 'Action Extraction',
  red_team_check: 'Red Team Check',
  fact_check_mode: 'Fact Check Mode',
  anti_generic: 'Anti-Generic',
  stepwise_mode: 'Stepwise Mode',
  off_piste_drift: 'Topic Drift',
  off_piste_constraint: 'Constraint Violation',
  off_piste_invented: 'Invented Context',
  off_piste_looping: 'Looping Detection',
  sycophancy_detection: 'Sycophancy Detection',
};

export function RecommendationsPanel({ recommendations }: Props) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <span className="text-2xl mb-2">✓</span>
        <p className="text-text-muted">
          All coaching tips are performing well.
        </p>
        <p className="text-xs text-text-muted mt-1">
          No recommendations at this time.
        </p>
      </div>
    );
  }

  // Sort by priority
  const sortedRecs = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {sortedRecs.map((rec, index) => {
        const actionDisplay = ACTION_DISPLAY[rec.action];
        const typeName = COACHING_TYPE_NAMES[rec.coachingType] || rec.coachingType;

        return (
          <div
            key={`${rec.coachingType}-${index}`}
            className={clsx(
              'p-3 rounded-lg border transition-colors',
              rec.priority === 'high'
                ? 'bg-score-low/10 border-score-low/30'
                : rec.priority === 'medium'
                ? 'bg-score-mid/10 border-score-mid/30'
                : 'bg-surface-tertiary border-border'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={clsx('text-sm', actionDisplay.color)}>
                  {actionDisplay.icon}
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {typeName}
                </span>
              </div>
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full',
                  rec.priority === 'high'
                    ? 'bg-score-low/20 text-score-low'
                    : rec.priority === 'medium'
                    ? 'bg-score-mid/20 text-score-mid'
                    : 'bg-surface-tertiary text-text-muted'
                )}
              >
                {rec.priority}
              </span>
            </div>

            {/* Action */}
            <div className={clsx('text-xs font-medium mb-1', actionDisplay.color)}>
              {actionDisplay.label}
            </div>

            {/* Reason */}
            <p className="text-xs text-text-muted mb-2">{rec.reason}</p>

            {/* Supporting Data */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Effectiveness:</span>
                <span
                  className={clsx(
                    'font-medium',
                    rec.supportingData.currentEffectiveness >= 0.4
                      ? 'text-score-high'
                      : rec.supportingData.currentEffectiveness >= 0.25
                      ? 'text-score-mid'
                      : 'text-score-low'
                  )}
                >
                  {(rec.supportingData.currentEffectiveness * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Dismissal:</span>
                <span
                  className={clsx(
                    'font-medium',
                    rec.supportingData.currentDismissal <= 0.3
                      ? 'text-score-high'
                      : rec.supportingData.currentDismissal <= 0.5
                      ? 'text-score-mid'
                      : 'text-score-low'
                  )}
                >
                  {(rec.supportingData.currentDismissal * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Samples:</span>
                <span className="font-medium text-text-primary">
                  {rec.supportingData.sampleSize}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Trend:</span>
                <span
                  className={clsx(
                    'font-medium',
                    rec.supportingData.trend === 'improving'
                      ? 'text-score-high'
                      : rec.supportingData.trend === 'declining'
                      ? 'text-score-low'
                      : 'text-text-muted'
                  )}
                >
                  {rec.supportingData.trend === 'improving'
                    ? '↑'
                    : rec.supportingData.trend === 'declining'
                    ? '↓'
                    : '→'}
                </span>
              </div>
            </div>

            {/* Suggested Filters */}
            {rec.suggestedFilters && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-xs text-text-muted mb-1">Suggested filters:</p>
                <div className="flex flex-wrap gap-1">
                  {rec.suggestedFilters.expertiseFilter?.map(stage => (
                    <span
                      key={stage}
                      className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full"
                    >
                      {stage}
                    </span>
                  ))}
                  {rec.suggestedFilters.domainFilter?.map(domain => (
                    <span
                      key={domain}
                      className="text-xs px-2 py-0.5 bg-score-high/20 text-score-high rounded-full"
                    >
                      {domain}
                    </span>
                  ))}
                  {rec.suggestedFilters.behaviorFilter?.map(behavior => (
                    <span
                      key={behavior}
                      className="text-xs px-2 py-0.5 bg-score-mid/20 text-score-mid rounded-full"
                    >
                      {behavior}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Best/Worst Segments */}
            {(rec.supportingData.bestSegment || rec.supportingData.worstSegment) && (
              <div className="mt-2 pt-2 border-t border-border/50 flex gap-4 text-xs">
                {rec.supportingData.bestSegment && (
                  <div>
                    <span className="text-text-muted">Best for: </span>
                    <span className="text-score-high">{rec.supportingData.bestSegment}</span>
                  </div>
                )}
                {rec.supportingData.worstSegment && (
                  <div>
                    <span className="text-text-muted">Worst for: </span>
                    <span className="text-score-low">{rec.supportingData.worstSegment}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
