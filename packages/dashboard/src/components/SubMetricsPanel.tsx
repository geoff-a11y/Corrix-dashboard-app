import { useState } from 'react';
import { clsx } from 'clsx';

interface SubMetric {
  name: string;
  value: number;
}

interface SubMetricsPanelProps {
  dimension: 'results' | 'relationship' | 'resilience';
  dimensionScore: number;
  subMetrics: {
    results?: {
      efficiency: number;
      outputAccuracy: number;
      decisionQuality: number;
    };
    relationship?: {
      dialogueQuality: number;
      trustCalibration: number;
      appropriatenessOfReliance: number;
    };
    resilience?: {
      skillTrajectory: number;
      expertisePreservation: number;
      cognitiveSustainability: number;
    };
  };
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-score-high';
  if (score >= 40) return 'text-score-medium';
  return 'text-score-low';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-score-high';
  if (score >= 40) return 'bg-score-medium';
  return 'bg-score-low';
}

export function SubMetricsPanel({ dimension, dimensionScore, subMetrics }: SubMetricsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const dimensionLabels = {
    results: 'Results',
    relationship: 'Relationship',
    resilience: 'Resilience',
  };

  const subMetricsList: SubMetric[] = [];

  if (dimension === 'results' && subMetrics.results) {
    subMetricsList.push(
      { name: 'Efficiency', value: subMetrics.results.efficiency },
      { name: 'Output Accuracy', value: subMetrics.results.outputAccuracy },
      { name: 'Decision Quality', value: subMetrics.results.decisionQuality }
    );
  } else if (dimension === 'relationship' && subMetrics.relationship) {
    subMetricsList.push(
      { name: 'Dialogue Quality', value: subMetrics.relationship.dialogueQuality },
      { name: 'Trust Calibration', value: subMetrics.relationship.trustCalibration },
      { name: 'Appropriateness of Reliance', value: subMetrics.relationship.appropriatenessOfReliance }
    );
  } else if (dimension === 'resilience' && subMetrics.resilience) {
    subMetricsList.push(
      { name: 'Skill Trajectory', value: subMetrics.resilience.skillTrajectory },
      { name: 'Expertise Preservation', value: subMetrics.resilience.expertisePreservation },
      { name: 'Cognitive Sustainability', value: subMetrics.resilience.cognitiveSustainability }
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-bg-secondary hover:bg-bg-tertiary transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              getScoreBg(dimensionScore)
            )}
          />
          <span className="font-medium text-text-primary">
            {dimensionLabels[dimension]}
          </span>
          <span className={clsx('text-lg font-bold', getScoreColor(dimensionScore))}>
            {dimensionScore.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {isExpanded ? 'Hide' : 'Show'} sub-metrics
          </span>
          <svg
            className={clsx(
              'w-4 h-4 text-text-muted transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Sub-metrics - Expandable */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4 bg-bg-primary">
          {subMetricsList.map((metric) => (
            <div key={metric.name}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-text-secondary">{metric.name}</span>
                <span className={clsx('text-sm font-semibold', getScoreColor(metric.value))}>
                  {metric.value.toFixed(0)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all', getScoreBg(metric.value))}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
