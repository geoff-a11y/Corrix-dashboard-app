import { clsx } from 'clsx';

interface ScoreCardProps {
  title: string;
  score: number;
  change?: number;
  period?: string;
  subtitle?: string;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-score-high';
  if (score >= 40) return 'text-score-medium';
  return 'text-score-low';
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-score-high/10';
  if (score >= 40) return 'bg-score-medium/10';
  return 'bg-score-low/10';
}

export function ScoreCard({ title, score, change, period = '7d', subtitle }: ScoreCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm text-text-secondary font-medium">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        {change !== undefined && (
          <div
            className={clsx(
              'flex items-center gap-1 text-sm font-medium',
              isPositive && 'text-score-high',
              isNegative && 'text-score-low',
              !isPositive && !isNegative && 'text-text-muted'
            )}
          >
            {isPositive && '↑'}
            {isNegative && '↓'}
            {!isPositive && !isNegative && '→'}
            <span>{Math.abs(change).toFixed(1)}</span>
            <span className="text-text-muted text-xs">({period})</span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-3">
        <div
          className={clsx(
            'text-4xl font-bold tabular-nums',
            getScoreColor(score)
          )}
        >
          {score.toFixed(0)}
        </div>
        <div
          className={clsx(
            'mb-1 px-2 py-0.5 rounded text-xs font-medium',
            getScoreBgColor(score),
            getScoreColor(score)
          )}
        >
          {score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'}
        </div>
      </div>
    </div>
  );
}
