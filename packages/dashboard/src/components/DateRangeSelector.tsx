import { useState, useRef, useEffect } from 'react';
import { useDateRange, type DateRangePreset } from '@/contexts/DateRangeContext';
import { clsx } from 'clsx';

interface DateRangeSelectorProps {
  className?: string;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

function formatDateDisplay(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  // If same year as current, don't show year
  const currentYear = new Date().getFullYear();
  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    options.year = 'numeric';
  }

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

export function DateRangeSelector({ className }: DateRangeSelectorProps) {
  const { dateRange, setDateRange, setPreset } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync custom dates when dateRange changes
  useEffect(() => {
    setCustomStart(dateRange.startDate);
    setCustomEnd(dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      // Don't close dropdown for custom, let user pick dates
      setPreset('custom');
    } else {
      setPreset(preset);
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      setDateRange({
        preset: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setIsOpen(false);
    }
  };

  const displayLabel = dateRange.preset === 'custom'
    ? formatDateDisplay(dateRange.startDate, dateRange.endDate)
    : PRESETS.find(p => p.value === dateRange.preset)?.label || 'Last 30 days';

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-bg-tertiary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary hover:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
      >
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{displayLabel}</span>
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-lg z-50 min-w-[240px]">
          {/* Preset buttons */}
          <div className="p-2 border-b border-border-default">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  dateRange.preset === preset.value
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-bg-tertiary'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {dateRange.preset === 'custom' && (
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <label className="block text-xs text-text-muted">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd}
                  className="w-full bg-bg-tertiary border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-text-muted">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-bg-tertiary border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd || customStart > customEnd}
                className="w-full btn btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
