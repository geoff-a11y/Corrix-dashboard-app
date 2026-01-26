import { clsx } from 'clsx';

interface ViewToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function ViewToggle<T extends string>({ options, value, onChange }: ViewToggleProps<T>) {
  return (
    <div className="flex gap-1 bg-bg-secondary p-1 rounded-lg">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
