import type { TemporalIndicatorDashboard, TemporalIndicator } from '@corrix/shared';
import { clsx } from 'clsx';

interface TemporalIndicatorPanelProps {
  data: TemporalIndicatorDashboard;
  onIndicatorClick?: (indicator: TemporalIndicator) => void;
}

export function TemporalIndicatorPanel({ data, onIndicatorClick }: TemporalIndicatorPanelProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <HealthCard title="Overall Health" value={data.summary.overallHealth} />
        <HealthCard title="Leading" value={data.summary.leadingHealth} color="blue" />
        <HealthCard title="Concurrent" value={data.summary.concurrentHealth} color="purple" />
        <HealthCard title="Lagging" value={data.summary.laggingHealth} color="green" />
      </div>

      {/* Alert Summary */}
      {(data.summary.alertCount.warning > 0 || data.summary.alertCount.critical > 0) && (
        <div className="bg-score-low/10 border border-score-low/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <span className="font-medium text-score-low">
                {data.summary.alertCount.critical} critical, {data.summary.alertCount.warning} warning
              </span>
              <span className="text-text-secondary ml-2">indicators require attention</span>
            </div>
          </div>
        </div>
      )}

      {/* Three Columns */}
      <div className="grid grid-cols-3 gap-6">
        <IndicatorColumn
          title="Leading Indicators"
          subtitle="Predict future outcomes"
          indicators={data.leading}
          color="blue"
          onIndicatorClick={onIndicatorClick}
        />
        <IndicatorColumn
          title="Concurrent Indicators"
          subtitle="Current collaboration state"
          indicators={data.concurrent}
          color="purple"
          onIndicatorClick={onIndicatorClick}
        />
        <IndicatorColumn
          title="Lagging Indicators"
          subtitle="Confirmed outcomes"
          indicators={data.lagging}
          color="green"
          onIndicatorClick={onIndicatorClick}
        />
      </div>
    </div>
  );
}

function HealthCard({ title, value, color = 'default' }: { title: string; value: number; color?: string }) {
  const colorClasses = {
    default: 'text-accent-primary',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-score-high',
  };

  return (
    <div className="card">
      <p className="text-xs text-text-muted">{title}</p>
      <p className={clsx('text-2xl font-bold', colorClasses[color as keyof typeof colorClasses])}>
        {value.toFixed(0)}%
      </p>
    </div>
  );
}

function IndicatorColumn({
  title,
  subtitle,
  indicators,
  color,
  onIndicatorClick,
}: {
  title: string;
  subtitle: string;
  indicators: TemporalIndicator[];
  color: string;
  onIndicatorClick?: (indicator: TemporalIndicator) => void;
}) {
  const headerColors = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    green: 'bg-score-high/10 border-score-high/30',
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className={clsx('px-4 py-3 border-b', headerColors[color as keyof typeof headerColors])}>
        <h4 className="font-medium text-text-primary">{title}</h4>
        <p className="text-xs text-text-muted">{subtitle}</p>
      </div>

      <div className="divide-y divide-border-default">
        {indicators.map(indicator => (
          <div
            key={indicator.name}
            className="px-4 py-3 hover:bg-bg-secondary cursor-pointer transition-colors"
            onClick={() => onIndicatorClick?.(indicator)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-text-primary">{indicator.displayName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={indicator.status} />
                  <TrendBadge direction={indicator.trendDirection} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-text-primary">{indicator.currentValue.toFixed(0)}</p>
                <p className="text-xs text-text-muted">P{indicator.percentileRank.toFixed(0)}</p>
              </div>
            </div>
          </div>
        ))}
        {indicators.length === 0 && (
          <div className="px-4 py-6 text-center text-text-muted text-sm">
            No indicators available
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'normal' | 'warning' | 'critical' }) {
  const config = {
    normal: { bg: 'bg-score-high/10', text: 'text-score-high' },
    warning: { bg: 'bg-score-medium/10', text: 'text-score-medium' },
    critical: { bg: 'bg-score-low/10', text: 'text-score-low' },
  };

  const { bg, text } = config[status];

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', bg, text)}>
      {status}
    </span>
  );
}

function TrendBadge({ direction }: { direction: 'improving' | 'declining' | 'stable' }) {
  const config = {
    improving: { text: 'text-score-high', icon: '↑' },
    declining: { text: 'text-score-low', icon: '↓' },
    stable: { text: 'text-text-muted', icon: '→' },
  };

  const { text, icon } = config[direction];

  return <span className={clsx('text-xs', text)}>{icon}</span>;
}
