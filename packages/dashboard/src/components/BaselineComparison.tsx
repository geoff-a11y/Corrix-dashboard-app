import { clsx } from 'clsx';

interface BaselineComparisonProps {
  scope: 'organization' | 'team' | 'individual';
  entityId: string;
  entityName: string;
  baseline: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    capturedAt: string | null;
  } | null;
  current: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
  };
  showToggle?: boolean;
  loading?: boolean;
}

function getChangeColor(change: number): string {
  if (change > 5) return 'text-score-high';
  if (change < -5) return 'text-score-low';
  return 'text-text-muted';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-score-high';
  if (score >= 40) return 'text-score-medium';
  return 'text-score-low';
}

function ProgressBar({ baseline, current, max = 100 }: { baseline: number; current: number; max?: number }) {
  const baselinePct = (baseline / max) * 100;
  const currentPct = (current / max) * 100;

  return (
    <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden">
      {/* Baseline marker */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-text-muted z-10"
        style={{ left: `${baselinePct}%` }}
      />
      {/* Current progress */}
      <div
        className={clsx(
          'h-full rounded-full transition-all',
          current >= baseline ? 'bg-score-high' : 'bg-score-low'
        )}
        style={{ width: `${currentPct}%` }}
      />
    </div>
  );
}

export function BaselineComparison({
  scope,
  entityName,
  baseline,
  current,
  loading
}: BaselineComparisonProps) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 w-32 bg-bg-tertiary rounded mb-4" />
        <div className="h-12 w-24 bg-bg-tertiary rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-bg-tertiary rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!baseline) {
    return (
      <div className="card">
        <h3 className="text-sm font-medium text-text-secondary mb-2">Baseline Comparison</h3>
        <p className="text-text-muted text-sm">
          No baseline data available for {entityName}.
          {scope === 'individual' && ' Complete the baseline assessment to track progress.'}
        </p>
        <div className="mt-4">
          <p className="text-xs text-text-muted">Current Corrix Score</p>
          <p className="text-3xl font-bold text-text-primary">{current.corrixScore.toFixed(0)}</p>
        </div>
      </div>
    );
  }

  const change = current.corrixScore - baseline.corrixScore;
  const metrics = [
    { label: 'Results', baseline: baseline.results, current: current.results },
    { label: 'Relationship', baseline: baseline.relationship, current: current.relationship },
    { label: 'Resilience', baseline: baseline.resilience, current: current.resilience },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">
        Baseline vs Current
        <span className="text-text-muted font-normal ml-2">({entityName})</span>
      </h3>

      {/* Main score comparison */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          {/* Baseline */}
          <div className="flex-1">
            <p className="text-xs text-text-muted mb-1">Baseline</p>
            <div className={clsx('text-2xl font-bold', getScoreColor(baseline.corrixScore))}>
              {baseline.corrixScore.toFixed(0)}
            </div>
          </div>

          {/* Arrow with change */}
          <div className="flex flex-col items-center gap-1">
            <div className={clsx('text-2xl font-bold', getChangeColor(change))}>
              {change >= 0 ? '↑' : '↓'}
            </div>
            <div className={clsx('text-sm font-semibold', getChangeColor(change))}>
              {change >= 0 ? '+' : ''}{change.toFixed(0)}
            </div>
          </div>

          {/* Current */}
          <div className="flex-1 text-right">
            <p className="text-xs text-text-muted mb-1">Current</p>
            <div className={clsx('text-3xl font-bold', getScoreColor(current.corrixScore))}>
              {current.corrixScore.toFixed(0)}
            </div>
          </div>
        </div>
        <ProgressBar baseline={baseline.corrixScore} current={current.corrixScore} />
      </div>

      {/* 3Rs breakdown */}
      <div className="space-y-4">
        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">3Rs Breakdown</p>
        {metrics.map(({ label, baseline: b, current: c }) => {
          const metricChange = c - b;
          return (
            <div key={label} className="bg-bg-secondary rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={clsx('text-sm', getScoreColor(b))}>{b.toFixed(0)}</span>
                  <span className={clsx('text-lg', getChangeColor(metricChange))}>
                    {metricChange >= 0 ? '→' : '↓'}
                  </span>
                  <span className={clsx('text-sm font-semibold', getScoreColor(c))}>{c.toFixed(0)}</span>
                  <span className={clsx('text-xs font-medium ml-1', getChangeColor(metricChange))}>
                    ({metricChange >= 0 ? '+' : ''}{metricChange.toFixed(0)})
                  </span>
                </div>
              </div>
              <ProgressBar baseline={b} current={c} />
            </div>
          );
        })}
      </div>

      {baseline.capturedAt && (
        <p className="text-xs text-text-muted mt-4">
          Baseline captured: {new Date(baseline.capturedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
