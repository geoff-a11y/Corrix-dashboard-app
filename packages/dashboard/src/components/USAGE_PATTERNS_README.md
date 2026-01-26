# Usage Patterns & Expertise Tracking Components

This document describes the new dashboard enhancement components for usage patterns and expertise tracking.

## Components Overview

### 1. UsagePatterns Component
Displays user activity patterns including peak productivity times, weekly hours, and time-of-day heatmaps.

**Location:** `/components/UsagePatterns.tsx`

**Usage:**
```tsx
import { UsagePatterns } from '@/components';

<UsagePatterns
  data={{
    peakProductivityTime: 'afternoon',
    hoursPerWeek: 12.5,
    hoursPerWeekTrend: 8.3,
    typicalActiveDayParts: ['morning', 'afternoon'],
    activityByHour: [
      { hour: 9, count: 5 },
      { hour: 10, count: 8 },
      // ... more hours
    ],
    activityByDayOfWeek: [
      { day: 'Mon', hours: 2.5 },
      { day: 'Tue', hours: 3.2 },
      // ... more days
    ]
  }}
  showHeatmap={true}
/>
```

**Features:**
- Peak productivity time indicator with color coding
- Hours per week with trend indicator
- Typical active day parts badges
- Weekly activity bar chart
- 24-hour activity heatmap

---

### 2. ExpertiseBadge Components
Display expertise levels and vocabulary richness indicators for domain proficiency.

**Location:** `/components/ExpertiseBadge.tsx`

#### ExpertiseBadge
```tsx
import { ExpertiseBadge } from '@/components';

<ExpertiseBadge
  level="proficient"
  domain="Data Analysis"
  size="md"
  showLabel={true}
/>
```

**Expertise Levels:**
- `novice` - Gray, for new users
- `beginner` - Blue, learning basics
- `competent` - Yellow, solid understanding
- `proficient` - Green, advanced skills
- `expert` - Purple, domain mastery

#### VocabularyIndicator
```tsx
import { VocabularyIndicator } from '@/components';

<VocabularyIndicator
  level="advanced"
  score={72}
  size="md"
/>
```

**Vocabulary Levels:**
- `basic` - Basic terminology
- `advanced` - Advanced vocabulary
- `expert` - Expert-level vocabulary

#### DomainExpertise (Full Card)
```tsx
import { DomainExpertise } from '@/components';

<DomainExpertise
  domain="Machine Learning"
  expertiseLevel="proficient"
  vocabularyRichness="advanced"
  score={75}
  interactionCount={145}
  knowledgeTransferScore={68}
/>
```

**Features:**
- Domain name and score display
- Expertise level badge
- Vocabulary richness indicator
- Progress bar visualization
- Knowledge transfer score with explanation

#### Helper Functions
```tsx
import { getExpertiseLevel, getVocabularyRichness } from '@/components';

const expertiseLevel = getExpertiseLevel(score, interactionCount);
const vocabLevel = getVocabularyRichness(relationshipScore);
```

---

### 3. TrajectoryIndicator Components
Show learning trajectory and skill development trends.

**Location:** `/components/TrajectoryIndicator.tsx`

#### TrajectoryIndicator
```tsx
import { TrajectoryIndicator } from '@/components';

<TrajectoryIndicator
  direction="accelerating"
  value={12.5}
  size="md"
  showLabel={true}
  context="last 7 days"
/>
```

**Trajectory Directions:**
- `accelerating` - Green, rapid improvement
- `steady` - Yellow, consistent growth
- `plateauing` - Orange, slowing growth
- `declining` - Red, needs attention

#### TrajectoryCard
```tsx
import { TrajectoryCard } from '@/components';

<TrajectoryCard
  direction="steady"
  metric="Prompt Quality"
  currentValue={72}
  change={5.2}
  trend={0.8}
  recommendation="Continue focusing on context-rich prompts"
/>
```

#### TrajectoryBadge
```tsx
import { TrajectoryBadge } from '@/components';

<TrajectoryBadge direction="accelerating" size="sm" />
```

#### TrajectoryTimeline
```tsx
import { TrajectoryTimeline } from '@/components';

<TrajectoryTimeline
  points={[
    { date: '2024-01-15', value: 65, trajectory: 'steady' },
    { date: '2024-01-22', value: 72, trajectory: 'accelerating' },
    { date: '2024-01-29', value: 78, trajectory: 'accelerating' },
  ]}
/>
```

#### Helper Function
```tsx
import { calculateTrajectory } from '@/components';

const trajectory = calculateTrajectory(
  recentChange,  // e.g., 12.5 (percentage change)
  velocity,      // e.g., 2.5 (change per week)
  { accelerating: 2, steady: 0.5, declining: -0.5 }  // optional thresholds
);
```

---

## Integration Examples

### BehaviorsPage Integration
See `/pages/BehaviorsPage.tsx` for a complete example showing:
- Usage patterns section with activity heatmap
- Learning trajectory cards
- Domain expertise grid with knowledge transfer scores

### User Cards (Future Enhancement)
```tsx
// Example of adding trajectory indicator to user cards
<div className="user-card">
  <div className="flex items-center gap-2">
    <h3>{user.name}</h3>
    <TrajectoryBadge direction={userTrajectory} size="sm" />
  </div>
  <ExpertiseBadge level={userExpertise} size="sm" />
</div>
```

### Individual User View (Future Enhancement)
```tsx
// Example for detailed user profile
<div className="user-profile">
  <UsagePatterns data={userUsageData} showHeatmap={true} />

  <div className="grid grid-cols-3 gap-4">
    {userDomains.map(domain => (
      <DomainExpertise
        key={domain.id}
        domain={domain.name}
        expertiseLevel={getExpertiseLevel(domain.score, domain.interactions)}
        vocabularyRichness={getVocabularyRichness(domain.vocabScore)}
        score={domain.score}
        interactionCount={domain.interactions}
        knowledgeTransferScore={domain.transferScore}
      />
    ))}
  </div>

  <TrajectoryCard
    direction={calculateTrajectory(user.recentChange, user.velocity)}
    metric="Overall Skill Development"
    currentValue={user.currentScore}
    change={user.change}
    trend={user.velocity}
  />
</div>
```

---

## Design Patterns

### Color Coding
All components use consistent color schemes:
- **Green** (#22c55e): Positive/High performance
- **Yellow** (#fbbf24, #eab308): Medium/Warning
- **Orange** (#f59e0b): Attention needed
- **Red** (#ef4444): Low/Critical
- **Purple** (#8b5cf6, #5b4cdb): Expert level/Premium
- **Blue** (#3b82f6): Standard/Information

### Responsive Design
All components are responsive and work well on:
- Mobile (single column)
- Tablet (2 columns)
- Desktop (3+ columns)

### Tailwind Classes
Components use the existing Tailwind theme:
- `text-text-primary`, `text-text-secondary`, `text-text-muted`
- `bg-bg-secondary`, `bg-bg-tertiary`
- `border-border-subtle`, `border-border-default`
- `text-score-high`, `text-score-medium`, `text-score-low`
- `text-accent-primary`

---

## Data Structure Requirements

### UsagePatterns
```typescript
interface UsagePatternsData {
  peakProductivityTime: 'morning' | 'afternoon' | 'evening' | 'night';
  hoursPerWeek: number;
  hoursPerWeekTrend: number; // percentage change
  typicalActiveDayParts: string[];
  activityByHour?: Array<{ hour: number; count: number }>;
  activityByDayOfWeek?: Array<{ day: string; hours: number }>;
}
```

### Domain Expertise
```typescript
interface DomainData {
  domainId: string;
  domainName: string;
  overall: number;
  results: number;
  relationship: number;
  resilience: number;
  interactionCount: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}
```

### Trajectory
```typescript
interface TrajectoryData {
  direction: 'accelerating' | 'steady' | 'plateauing' | 'declining';
  currentValue: number;
  change: number;
  trend: number; // velocity of change (e.g., points per week)
}
```

---

## Future Enhancements

1. **Real-time Data Integration**
   - Connect to actual usage analytics APIs
   - Live updates for activity patterns

2. **Comparative Analysis**
   - Compare user patterns against team averages
   - Benchmark against organization

3. **Predictive Insights**
   - Forecast future trajectory
   - Recommend optimal usage times

4. **Gamification**
   - Achievement badges for expertise milestones
   - Streak tracking for consistent usage

5. **Export & Reporting**
   - PDF export of expertise profiles
   - CSV download of usage patterns
