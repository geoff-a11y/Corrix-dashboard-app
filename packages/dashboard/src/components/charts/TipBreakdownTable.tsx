import { useState } from 'react';
import { clsx } from 'clsx';
import type { CoachingTypeAnalytics } from '@corrix/shared';

interface Props {
  tips: CoachingTypeAnalytics[];
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
}

type SortField = 'displayName' | 'totalShown' | 'effectivenessRate' | 'dismissalRate' | 'improvementRate' | 'trend';
type SortDir = 'asc' | 'desc';

export function TipBreakdownTable({ tips, selectedType, onSelectType }: Props) {
  const [sortField, setSortField] = useState<SortField>('totalShown');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  if (!tips || tips.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted">
        No coaching tip data available
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedTips = [...tips].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    switch (sortField) {
      case 'displayName':
        aVal = a.displayName;
        bVal = b.displayName;
        break;
      case 'totalShown':
        aVal = a.overall.totalShown;
        bVal = b.overall.totalShown;
        break;
      case 'effectivenessRate':
        aVal = a.overall.effectivenessRate;
        bVal = b.overall.effectivenessRate;
        break;
      case 'dismissalRate':
        aVal = a.overall.dismissalRate;
        bVal = b.overall.dismissalRate;
        break;
      case 'improvementRate':
        aVal = a.overall.improvementRate;
        bVal = b.overall.improvementRate;
        break;
      case 'trend':
        aVal = a.trend === 'improving' ? 2 : a.trend === 'stable' ? 1 : 0;
        bVal = b.trend === 'improving' ? 2 : b.trend === 'stable' ? 1 : 0;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="text-left text-xs font-medium text-text-muted p-3 cursor-pointer hover:text-text-primary transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'safety':
        return 'bg-score-low/20 text-score-low';
      case 'quality':
        return 'bg-accent/20 text-accent';
      case 'efficiency':
        return 'bg-score-high/20 text-score-high';
      case 'behavior':
        return 'bg-score-mid/20 text-score-mid';
      default:
        return 'bg-surface-tertiary text-text-muted';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <span className="text-score-high">↑</span>;
      case 'declining':
        return <span className="text-score-low">↓</span>;
      default:
        return <span className="text-text-muted">→</span>;
    }
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <span className="text-xs text-score-high">●</span>;
      case 'medium':
        return <span className="text-xs text-score-mid">●</span>;
      default:
        return <span className="text-xs text-text-muted">●</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <SortHeader field="displayName">Coaching Type</SortHeader>
            <th className="text-left text-xs font-medium text-text-muted p-3">Category</th>
            <SortHeader field="totalShown">Shown</SortHeader>
            <SortHeader field="effectivenessRate">Effectiveness</SortHeader>
            <SortHeader field="dismissalRate">Dismissal</SortHeader>
            <SortHeader field="improvementRate">Improvement</SortHeader>
            <SortHeader field="trend">Trend</SortHeader>
            <th className="text-center text-xs font-medium text-text-muted p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedTips.map(tip => (
            <tr
              key={tip.coachingType}
              onClick={() => onSelectType(selectedType === tip.coachingType ? null : tip.coachingType)}
              className={clsx(
                'border-b border-border/50 cursor-pointer transition-colors',
                selectedType === tip.coachingType
                  ? 'bg-accent/10'
                  : 'hover:bg-surface-tertiary/50'
              )}
            >
              <td className="p-3">
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {tip.displayName}
                  </span>
                  <p className="text-xs text-text-muted mt-0.5">{tip.description}</p>
                </div>
              </td>
              <td className="p-3">
                <span className={clsx('text-xs px-2 py-1 rounded-full', getCategoryBadgeColor(tip.category))}>
                  {tip.category}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary font-medium">
                    {tip.overall.totalShown.toLocaleString()}
                  </span>
                  {getConfidenceBadge(tip.overall.confidenceLevel)}
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        tip.overall.effectivenessRate >= 0.4 ? 'bg-score-high' :
                        tip.overall.effectivenessRate >= 0.25 ? 'bg-score-mid' : 'bg-score-low'
                      )}
                      style={{ width: `${Math.min(tip.overall.effectivenessRate * 100, 100)}%` }}
                    />
                  </div>
                  <span className={clsx(
                    'text-sm font-medium',
                    tip.overall.effectivenessRate >= 0.4 ? 'text-score-high' :
                    tip.overall.effectivenessRate >= 0.25 ? 'text-score-mid' : 'text-score-low'
                  )}>
                    {(tip.overall.effectivenessRate * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        tip.overall.dismissalRate <= 0.3 ? 'bg-score-high' :
                        tip.overall.dismissalRate <= 0.5 ? 'bg-score-mid' : 'bg-score-low'
                      )}
                      style={{ width: `${Math.min(tip.overall.dismissalRate * 100, 100)}%` }}
                    />
                  </div>
                  <span className={clsx(
                    'text-sm font-medium',
                    tip.overall.dismissalRate <= 0.3 ? 'text-score-high' :
                    tip.overall.dismissalRate <= 0.5 ? 'text-score-mid' : 'text-score-low'
                  )}>
                    {(tip.overall.dismissalRate * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="p-3">
                <span className={clsx(
                  'text-sm font-medium',
                  tip.overall.improvementRate >= 0.5 ? 'text-score-high' :
                  tip.overall.improvementRate >= 0.3 ? 'text-score-mid' : 'text-score-low'
                )}>
                  {(tip.overall.improvementRate * 100).toFixed(0)}%
                </span>
              </td>
              <td className="p-3 text-center">
                {getTrendIcon(tip.trend)}
              </td>
              <td className="p-3 text-center">
                <span className={clsx(
                  'text-xs px-2 py-1 rounded-full',
                  tip.enabled ? 'bg-score-high/20 text-score-high' : 'bg-score-low/20 text-score-low'
                )}>
                  {tip.enabled ? 'Active' : 'Disabled'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedType && (
        <div className="mt-4 pt-4 border-t border-border text-sm text-text-muted text-center">
          Click the row again to deselect, or view the trend chart below
        </div>
      )}
    </div>
  );
}
