// Temporal indicator classification
export type Temporality = 'leading' | 'concurrent' | 'lagging';
export type TrendDirection = 'improving' | 'declining' | 'stable';
export type Dimension = 'results' | 'relationship' | 'resilience';

// Individual indicator value
export interface TemporalIndicator {
  name: string;
  displayName: string;
  dimension: Dimension;
  temporality: Temporality;

  // Current values
  currentValue: number;
  baselineValue: number;      // User's personal baseline
  populationValue: number;    // Org average

  // Deviations
  deviationFromBaseline: number;   // % difference from personal baseline
  deviationFromPopulation: number; // % difference from org average
  percentileRank: number;          // 0-100, where user falls

  // Trend
  trendDirection: TrendDirection;
  trendVelocity: number;           // Rate of change

  // Thresholds (for alerts)
  warningThreshold?: { low?: number; high?: number };
  criticalThreshold?: { low?: number; high?: number };
  status: 'normal' | 'warning' | 'critical';
}

// Grouped by temporality for dashboard view
export interface TemporalIndicatorDashboard {
  date: string;

  leading: TemporalIndicator[];    // Predict future
  concurrent: TemporalIndicator[]; // Current state
  lagging: TemporalIndicator[];    // Confirmed outcomes

  // Summary metrics
  summary: {
    leadingHealth: number;      // 0-100, overall leading indicator health
    concurrentHealth: number;
    laggingHealth: number;
    overallHealth: number;
    alertCount: { warning: number; critical: number };
  };
}

// For tracking indicator changes over time
export interface IndicatorTrend {
  indicatorName: string;
  points: Array<{
    date: string;
    value: number;
    baseline: number;
    population: number;
  }>;
  overallTrend: TrendDirection;
  correlationWithOutcomes: number;  // -1 to 1
}

// Indicator definition (for configuration)
export interface IndicatorDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  dimension: Dimension;
  temporality: Temporality;
  sourceTable: string;
  sourceColumn: string;
  aggregationMethod: 'avg' | 'sum' | 'count' | 'max' | 'min';
  warningThresholdLow?: number;
  warningThresholdHigh?: number;
  criticalThresholdLow?: number;
  criticalThresholdHigh?: number;
  displayOrder: number;
  colorScheme: string;
  icon?: string;
  isActive: boolean;
}

// Leading indicator alerts
export interface LeadingIndicatorAlert {
  indicator: TemporalIndicator;
  userId: string;
  teamId?: string;
  alertType: 'warning' | 'critical';
  message: string;
  recommendation: string;
  triggeredAt: string;
}
