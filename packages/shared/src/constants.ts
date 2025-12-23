// Score thresholds
export const SCORE_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
  LOW: 0,
} as const;

// Time periods
export const PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

// Platforms
export const PLATFORMS = ['claude', 'chatgpt', 'gemini'] as const;

// Action types
export const ACTION_TYPES = ['accept', 'copy', 'edit', 'regenerate', 'abandon'] as const;

// Default date ranges
export const DEFAULT_RANGES = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
} as const;
