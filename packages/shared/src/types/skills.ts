// Skill components (aligned with Critical Intelligence practices)
export interface SkillComponents {
  promptEngineering: number;    // Direction/prompting skill
  outputEvaluation: number;     // Critique/evaluation skill
  verification: number;         // Scrutiny/corroboration skill
  iteration: number;            // Dialogue/refinement skill
  adaptation: number;           // Adaptability skill
  criticalThinking: number;     // Recalibration skill
}

// Daily skill snapshot
export interface SkillSnapshot {
  userId: string;
  date: string;

  overallSkillScore: number;
  components: SkillComponents;

  // Trajectory
  trajectoryScore: number;      // Rate of improvement
  trajectoryDirection: 'accelerating' | 'steady' | 'plateauing' | 'declining';
  daysSinceImprovement: number;

  // Comparisons
  percentileInOrg: number;
  percentileInRole: number;
  percentileInDepartment: number;

  // Activity context
  sessionsInPeriod: number;
  interactionsInPeriod: number;
}

// Skill trajectory for visualization
export interface SkillTrajectory {
  userId: string;
  userName?: string;  // If available

  // Time series
  points: Array<{
    date: string;
    overallScore: number;
    components: SkillComponents;
  }>;

  // Trajectory analysis
  currentScore: number;
  startScore: number;
  improvement: number;          // Absolute points gained
  improvementRate: number;      // Points per week

  // Milestones
  milestones: CompetencyEvent[];

  // Predictions (based on trajectory)
  projectedScore30d: number;
  projectedScore90d: number;
  daysToNextMilestone?: number;
}

// Competency milestone event
export interface CompetencyEvent {
  eventType: 'first_interaction' | 'reached_baseline' | 'reached_competent' |
             'reached_proficient' | 'reached_expert' | 'skill_milestone' |
             'streak_milestone' | 'improvement_milestone';
  milestoneName: string;
  milestoneValue: number;
  previousValue?: number;
  occurredAt: string;
  daysSinceFirstUse: number;
}

// Learning velocity for leaderboards
export interface LearningVelocity {
  userId: string;
  userName?: string;
  teamName?: string;

  // Velocity (points per week)
  velocity7d: number;
  velocity14d: number;
  velocity30d: number;
  velocity90d: number;

  // Acceleration
  acceleration: number;  // Change in velocity

  // Rankings
  rankInOrg: number;
  rankInTeam: number;
  rankInRole: number;

  percentileInOrg: number;

  // Current state
  currentScore: number;
}

// Skill gap analysis
export interface SkillGap {
  skillName: string;
  displayName: string;

  currentValue: number;
  targetValue: number;         // Benchmark target
  gap: number;                 // Target - Current
  gapPercentage: number;       // Gap as % of target

  priority: 'high' | 'medium' | 'low';
  estimatedDaysToClose: number | null;

  // Recommendations
  recommendations: string[];
}

export interface SkillGapAnalysis {
  userId: string;
  analyzedAt: string;

  // Overall
  overallGap: number;
  overallProgress: number;     // 0-100, how far toward full competency

  // By component
  gaps: SkillGap[];

  // Priority ranking
  prioritizedGaps: SkillGap[];  // Sorted by impact

  // Time to competency
  estimatedDaysToCompetency: number | null;
  actualDaysSinceStart: number;
}

// Time to competency metrics
export interface TimeToCompetencyMetrics {
  // Population stats
  population: {
    mean: number;
    median: number;
    p25: number;
    p75: number;
    p90: number;
    sampleSize: number;
  };

  // Breakdown by milestone
  milestones: Array<{
    milestone: string;
    threshold: number;
    meanDays: number;
    medianDays: number;
    achievedCount: number;
    totalUsers: number;
    achievementRate: number;
  }>;

  // Cohort analysis
  cohorts: Array<{
    cohortName: string;       // e.g., "Q1 2025 Onboards"
    startDate: string;
    userCount: number;
    medianTimeToCompetency: number;
    competencyRate: number;   // % who reached competency
  }>;
}

// Velocity period types
export type VelocityPeriod = '7d' | '14d' | '30d' | '90d';
