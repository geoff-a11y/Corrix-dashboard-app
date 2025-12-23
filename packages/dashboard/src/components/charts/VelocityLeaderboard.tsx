import type { LearningVelocity, VelocityPeriod } from '@corrix/shared';
import { clsx } from 'clsx';

interface VelocityLeaderboardProps {
  data: LearningVelocity[];
  period: VelocityPeriod;
  highlightUserId?: string;
  onUserSelect?: (userId: string) => void;
}

export function VelocityLeaderboard({
  data,
  period,
  highlightUserId,
  onUserSelect,
}: VelocityLeaderboardProps) {
  const getVelocityForPeriod = (user: LearningVelocity) => {
    switch (period) {
      case '7d': return user.velocity7d;
      case '14d': return user.velocity14d;
      case '30d': return user.velocity30d;
      case '90d': return user.velocity90d;
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-text-secondary">Learning Velocity Leaders</h3>
        <span className="text-xs text-text-muted">Points/week ({period})</span>
      </div>

      <div className="divide-y divide-border-default">
        {data.map((user, index) => {
          const velocity = getVelocityForPeriod(user);
          const isHighlighted = user.userId === highlightUserId;

          return (
            <div
              key={user.userId}
              onClick={() => onUserSelect?.(user.userId)}
              className={clsx(
                'py-3 flex items-center justify-between cursor-pointer hover:bg-bg-secondary transition-colors',
                isHighlighted && 'bg-accent-primary/5'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-8 flex-shrink-0">
                  {index < 3 ? (
                    <span className={clsx(
                      'text-lg',
                      index === 0 && 'text-yellow-500',
                      index === 1 && 'text-gray-400',
                      index === 2 && 'text-amber-600'
                    )}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-text-muted font-medium">{index + 1}</span>
                  )}
                </div>

                {/* User info */}
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {user.userName || `User ${user.userId.slice(0, 8)}`}
                  </p>
                  {user.teamName && (
                    <p className="text-xs text-text-muted">{user.teamName}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Current score */}
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{user.currentScore.toFixed(0)}</p>
                  <p className="text-xs text-text-muted">Score</p>
                </div>

                {/* Velocity */}
                <div className="text-right min-w-[80px]">
                  <div className="flex items-center justify-end gap-1">
                    <span className={clsx(
                      'text-lg font-bold',
                      velocity > 0 ? 'text-score-high' : 'text-score-low'
                    )}>
                      {velocity > 0 ? '+' : ''}{velocity.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">pts/week</p>
                </div>

                {/* Percentile */}
                <div className="text-right min-w-[60px]">
                  <p className="text-sm font-medium text-text-primary">
                    Top {(100 - user.percentileInOrg).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="py-8 text-center text-text-muted">
          No velocity data available
        </div>
      )}
    </div>
  );
}
