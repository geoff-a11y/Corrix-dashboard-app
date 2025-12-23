// Benchmark scope types
export type BenchmarkScope = 'global' | 'organization' | 'department' | 'team' | 'role' | 'role_category';

// Role categories
export type RoleCategory = 'technical' | 'analytical' | 'creative' | 'managerial' | 'operational' | 'strategic' | 'other';

// Seniority levels
export type SeniorityLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive';

// Benchmark data
export interface Benchmark {
  scopeType: BenchmarkScope;
  scopeId?: string;
  scopeName?: string;

  metricName: string;
  metricDimension?: 'results' | 'relationship' | 'resilience';

  // Stats
  mean: number;
  median: number;
  stddev: number;

  // Percentiles
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };

  // Sample info
  sampleSize: number;
  activeUsers: number;

  // Time context
  periodStart: string;
  periodEnd: string;
}

// Department analytics
export interface DepartmentAnalytics {
  departmentId: string;
  departmentName: string;
  parentDepartmentName?: string;

  // User counts
  totalUsers: number;
  activeUsers: number;

  // Score summary
  scores: {
    corrixScore: { mean: number; median: number; trend: 'up' | 'down' | 'stable' };
    results: { mean: number; median: number };
    relationship: { mean: number; median: number };
    resilience: { mean: number; median: number };
  };

  // Comparisons
  vsOrganization: {
    corrixScoreDiff: number;
    percentileInOrg: number;
  };

  // Top performers
  topPerformers: Array<{
    userId: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  // Skill distribution
  skillDistribution: {
    belowBaseline: number;   // % below 50
    baseline: number;        // % 50-69
    competent: number;       // % 70-84
    proficient: number;      // % 85-94
    expert: number;          // % 95+
  };
}

// Role analytics
export interface RoleAnalytics {
  roleId: string;
  roleName: string;
  roleCategory: RoleCategory;

  // User counts
  totalUsers: number;
  activeUsers: number;

  // Score summary
  scores: {
    corrixScore: { mean: number; median: number };
    results: { mean: number; median: number };
    relationship: { mean: number; median: number };
    resilience: { mean: number; median: number };
  };

  // Role-specific patterns
  patterns: {
    averagePromptLength: number;
    averageDialogueDepth: number;
    verificationRate: number;
    preferredPlatform: 'claude' | 'chatgpt' | 'gemini' | 'other';
    peakUsageHours: number[];
  };

  // Comparison to similar roles
  vsSimilarRoles: Array<{
    roleName: string;
    corrixScoreDiff: number;
  }>;

  // Benchmark targets
  benchmarkTarget: number;
  percentAtTarget: number;
}

// Cross-department comparison
export interface DepartmentComparison {
  departments: DepartmentAnalytics[];

  // Rankings
  ranking: Array<{
    departmentId: string;
    departmentName: string;
    rank: number;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  // Highlights
  topPerforming: DepartmentAnalytics;
  mostImproved: DepartmentAnalytics;
  needsAttention: DepartmentAnalytics[];
}

// Department summary for lists
export interface DepartmentSummary {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  userCount: number;
}

// Role summary for lists
export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
  category: RoleCategory;
  userCount: number;
}

// User metadata for benchmarking
export interface UserMetadata {
  userId: string;
  departmentId?: string;
  departmentName?: string;
  roleId?: string;
  roleName?: string;
  seniorityLevel?: SeniorityLevel;
  yearsInRole?: number;
  yearsWithAiTools?: number;
  primaryUseCase?: string;
}
