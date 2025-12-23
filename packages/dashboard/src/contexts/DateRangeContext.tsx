import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string;  // YYYY-MM-DD
  endDate: string;
}

interface DateRangeContextValue {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: DateRangePreset) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

const STORAGE_KEY = 'corrix-date-range';

function calculateDates(preset: DateRangePreset): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (preset) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'custom':
      // For custom, keep existing dates
      startDate.setDate(endDate.getDate() - 30);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

function getInitialDateRange(): DateRange {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored data has required fields
      if (parsed.preset && parsed.startDate && parsed.endDate) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Default to last 30 days
  const dates = calculateDates('30d');
  return {
    preset: '30d',
    ...dates,
  };
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRange>(getInitialDateRange);

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setPreset = useCallback((preset: DateRangePreset) => {
    const dates = calculateDates(preset);
    const newRange: DateRange = {
      preset,
      ...dates,
    };
    setDateRange(newRange);
  }, [setDateRange]);

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, setPreset }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}
