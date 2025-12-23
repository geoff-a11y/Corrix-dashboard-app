import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-text-primary">{value}</span>
            {trend && (
              <span
                className={clsx(
                  'text-sm font-medium mb-1',
                  trend.direction === 'up' && 'text-score-high',
                  trend.direction === 'down' && 'text-score-low',
                  trend.direction === 'stable' && 'text-text-muted'
                )}
              >
                {trend.direction === 'up' && '↑'}
                {trend.direction === 'down' && '↓'}
                {trend.direction === 'stable' && '→'}
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-bg-secondary flex items-center justify-center text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
