import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-bg-tertiary rounded',
        className
      )}
      style={style}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('card', className)}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonChart({ className, height = 220 }: SkeletonProps & { height?: number }) {
  return (
    <div className={clsx('card', className)}>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={clsx('card', className)}>
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
