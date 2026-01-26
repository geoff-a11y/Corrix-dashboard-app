import { clsx } from 'clsx';

export type TrajectoryDirection = 'accelerating' | 'steady' | 'plateauing' | 'declining';

interface TrajectoryIndicatorProps {
  direction: TrajectoryDirection;
  value?: number; // percentage or score change
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  context?: string; // e.g., "last 7 days"
}

interface TrajectoryCardProps {
  direction: TrajectoryDirection;
  metric: string;
  currentValue: number;
  change: number;
  trend: number; // velocity of change
  recommendation?: string;
}

const TRAJECTORY_CONFIG = {
  accelerating: {
    label: 'Accelerating',
    icon: '↗',
    color: 'text-score-high',
    bgColor: 'bg-score-high/10',
    borderColor: 'border-score-high/30',
    description: 'Skills improving rapidly',
  },
  steady: {
    label: 'Steady',
    icon: '→',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'Consistent growth',
  },
  plateauing: {
    label: 'Plateauing',
    icon: '→',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Growth has slowed',
  },
  declining: {
    label: 'Declining',
    icon: '↘',
    color: 'text-score-low',
    bgColor: 'bg-score-low/10',
    borderColor: 'border-score-low/30',
    description: 'Skills need attention',
  },
};

export function TrajectoryIndicator({
  direction,
  value,
  size = 'md',
  showLabel = true,
  context,
}: TrajectoryIndicatorProps) {
  const config = TRAJECTORY_CONFIG[direction];

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      icon: 'text-xs',
    },
    md: {
      container: 'px-2.5 py-1 text-sm gap-1.5',
      icon: 'text-base',
    },
    lg: {
      container: 'px-3 py-1.5 text-base gap-2',
      icon: 'text-xl',
    },
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full font-medium border',
        config.bgColor,
        config.borderColor,
        sizeClasses[size].container
      )}
      title={config.description}
    >
      <span className={clsx(config.color, sizeClasses[size].icon)}>
        {config.icon}
      </span>
      {showLabel && (
        <span className={config.color}>
          {config.label}
        </span>
      )}
      {value !== undefined && (
        <span className="text-text-muted">
          ({value > 0 ? '+' : ''}{value.toFixed(1)}{typeof value === 'number' && '%'})
        </span>
      )}
      {context && size !== 'sm' && (
        <span className="text-text-muted text-xs">
          {context}
        </span>
      )}
    </div>
  );
}

export function TrajectoryCard({
  direction,
  metric,
  currentValue,
  change,
  trend,
  recommendation,
}: TrajectoryCardProps) {
  const config = TRAJECTORY_CONFIG[direction];

  return (
    <div className={clsx(
      'p-4 rounded-lg border-2 transition-colors',
      config.borderColor,
      config.bgColor
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-1">{metric}</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {currentValue.toFixed(0)}
            </span>
            <span className={clsx('text-lg font-medium mb-0.5', config.color)}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}
            </span>
          </div>
        </div>
        <div className={clsx('text-3xl', config.color)}>
          {config.icon}
        </div>
      </div>

      {/* Trajectory Badge */}
      <div className="mb-3">
        <TrajectoryIndicator direction={direction} size="sm" showLabel={true} />
      </div>

      {/* Trend Velocity */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Growth Rate</span>
          <span className={config.color}>
            {trend > 0 ? '+' : ''}{trend.toFixed(2)}/week
          </span>
        </div>
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              config.color.replace('text-', 'bg-')
            )}
            style={{ width: `${Math.min(Math.abs(trend) * 10, 100)}%` }}
          />
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <p className="text-xs text-text-secondary">
            <span className="font-medium">Tip:</span> {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for use in lists/cards
export function TrajectoryBadge({
  direction,
  size = 'sm',
}: {
  direction: TrajectoryDirection;
  size?: 'sm' | 'md';
}) {
  const config = TRAJECTORY_CONFIG[direction];

  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium border',
        config.bgColor,
        config.borderColor,
        config.color,
        size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
      )}
      title={config.description}
    >
      {config.icon}
    </div>
  );
}

// Helper function to determine trajectory from data
export function calculateTrajectory(
  recentChange: number,
  velocity: number,
  threshold = { accelerating: 2, steady: 0.5, declining: -0.5 }
): TrajectoryDirection {
  // Accelerating: significant positive change AND increasing velocity
  if (recentChange > 5 && velocity >= threshold.accelerating) {
    return 'accelerating';
  }

  // Declining: negative change or decreasing velocity
  if (recentChange < 0 || velocity < threshold.declining) {
    return 'declining';
  }

  // Plateauing: minimal change despite previous growth
  if (Math.abs(velocity) < threshold.steady && recentChange < 3) {
    return 'plateauing';
  }

  // Steady: consistent positive growth
  return 'steady';
}

// Component for displaying trajectory over time
export function TrajectoryTimeline({
  points,
}: {
  points: Array<{
    date: string;
    value: number;
    trajectory: TrajectoryDirection;
  }>;
}) {
  return (
    <div className="space-y-2">
      {points.map((point, index) => (
        <div key={point.date} className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-20">
            {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <TrajectoryBadge direction={point.trajectory} />
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-primary"
                style={{ width: `${point.value}%` }}
              />
            </div>
            <span className="text-xs text-text-primary w-8 text-right">
              {point.value.toFixed(0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
