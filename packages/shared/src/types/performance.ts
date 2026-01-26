export interface BaselineComparisonResponse {
  scope: 'organization' | 'team' | 'individual';
  entityId: string;
  entityName: string;
  baseline: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    capturedAt: string | null;
  };
  current: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    asOf: string;
  };
  change: {
    corrixScore: number;
    results: number;
    relationship: number;
    resilience: number;
    percentageChange: number;
  };
  hasBaseline: boolean;
}

export interface ScoreDriver {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative';
  description: string;
  recommendation?: string;
}

export interface ScoreDriversResponse {
  drivers: ScoreDriver[];
  topPositive: ScoreDriver[];
  topNegative: ScoreDriver[];
}
