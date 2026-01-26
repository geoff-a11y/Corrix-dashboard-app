import { clsx } from 'clsx';

interface AlertCardProps {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  metric?: { name: string; value: number; change: number };
  entityName?: string;
  onClick?: () => void;
}

export function AlertCard({
  severity,
  title,
  description,
  recommendation,
  metric,
  entityName,
  onClick
}: AlertCardProps) {
  const severityStyles = {
    critical: 'bg-score-low/10 border-score-low/30',
    warning: 'bg-score-medium/10 border-score-medium/30',
    info: 'bg-accent/10 border-accent/30',
  };

  const severityIcon = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  };

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border transition-colors',
        severityStyles[severity],
        onClick && 'cursor-pointer hover:bg-opacity-20'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{severityIcon[severity]}</span>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-text-primary">{title}</h4>
            {entityName && (
              <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
                {entityName}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">{description}</p>

          {metric && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-text-muted">{metric.name}:</span>
              <span className="font-medium text-text-primary">{metric.value}</span>
              <span className={clsx(
                'text-xs',
                metric.change > 0 ? 'text-score-high' : 'text-score-low'
              )}>
                ({metric.change > 0 ? '+' : ''}{metric.change}%)
              </span>
            </div>
          )}

          {recommendation && (
            <p className="text-sm text-accent mt-2 flex items-center gap-1">
              💡 {recommendation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
