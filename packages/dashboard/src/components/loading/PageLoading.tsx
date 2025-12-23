import { Spinner } from './Spinner';

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size="lg" />
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}
