# Quick Start Guide: Dashboard Enhancements

## What's New

Three new component families have been added to enhance the Corrix dashboard:

1. **UsagePatterns** - Visualize user activity patterns
2. **ExpertiseBadge** - Show domain expertise and vocabulary levels
3. **TrajectoryIndicator** - Display learning trajectory and growth trends

## Installation

All components are already integrated. No installation needed!

## Quick Examples

### 1. Display Usage Patterns

```tsx
import { UsagePatterns } from '@/components';

function MyPage() {
  return (
    <UsagePatterns
      data={{
        peakProductivityTime: 'afternoon',
        hoursPerWeek: 12.5,
        hoursPerWeekTrend: 8.3,
        typicalActiveDayParts: ['morning', 'afternoon'],
      }}
      showHeatmap={true}
    />
  );
}
```

### 2. Show Expertise Badge

```tsx
import { ExpertiseBadge, getExpertiseLevel } from '@/components';

function UserCard({ user }) {
  const level = getExpertiseLevel(user.score, user.interactions);

  return (
    <ExpertiseBadge
      level={level}
      domain={user.domain}
      size="sm"
    />
  );
}
```

### 3. Display Domain Expertise Card

```tsx
import { DomainExpertise, getExpertiseLevel, getVocabularyRichness } from '@/components';

function DomainList({ domains }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map(domain => (
        <DomainExpertise
          key={domain.id}
          domain={domain.name}
          expertiseLevel={getExpertiseLevel(domain.score, domain.count)}
          vocabularyRichness={getVocabularyRichness(domain.vocabScore)}
          score={domain.score}
          interactionCount={domain.count}
          knowledgeTransferScore={domain.transferScore}
        />
      ))}
    </div>
  );
}
```

### 4. Show Learning Trajectory

```tsx
import { TrajectoryCard, calculateTrajectory } from '@/components';

function ProgressSection({ metrics }) {
  const trajectory = calculateTrajectory(
    metrics.recentChange,
    metrics.velocity
  );

  return (
    <TrajectoryCard
      direction={trajectory}
      metric="Overall Progress"
      currentValue={metrics.current}
      change={metrics.recentChange}
      trend={metrics.velocity}
      recommendation="Keep up the great work!"
    />
  );
}
```

### 5. Compact Trajectory Badge

```tsx
import { TrajectoryBadge } from '@/components';

function UserListItem({ user }) {
  return (
    <div className="flex items-center gap-2">
      <span>{user.name}</span>
      <TrajectoryBadge direction={user.trajectory} size="sm" />
    </div>
  );
}
```

## Where to See It

### BehaviorsPage
The new components are already integrated in the BehaviorsPage:

1. Navigate to `/behaviors` in the dashboard
2. Scroll down to see:
   - **Usage Patterns** section with activity heatmap
   - **Learning Trajectory** section with two trajectory cards
   - **Domain Expertise** section with expertise badges and knowledge transfer scores

## Component Locations

```
corrix-dashboard/
├── packages/dashboard/src/
│   ├── components/
│   │   ├── UsagePatterns.tsx         ← Usage pattern visualization
│   │   ├── ExpertiseBadge.tsx        ← Expertise & vocabulary indicators
│   │   ├── TrajectoryIndicator.tsx   ← Learning trajectory components
│   │   └── index.ts                  ← All exports
│   └── pages/
│       └── BehaviorsPage.tsx         ← Integration example
```

## Component Props Quick Reference

### UsagePatterns
```typescript
{
  data: {
    peakProductivityTime: 'morning' | 'afternoon' | 'evening' | 'night',
    hoursPerWeek: number,
    hoursPerWeekTrend: number,
    typicalActiveDayParts: string[],
    activityByHour?: { hour: number; count: number }[],
    activityByDayOfWeek?: { day: string; hours: number }[]
  },
  showHeatmap?: boolean  // default: false
}
```

### ExpertiseBadge
```typescript
{
  level: 'novice' | 'beginner' | 'competent' | 'proficient' | 'expert',
  domain?: string,
  size?: 'sm' | 'md' | 'lg',  // default: 'md'
  showLabel?: boolean          // default: true
}
```

### DomainExpertise
```typescript
{
  domain: string,
  expertiseLevel: ExpertiseLevel,
  vocabularyRichness: VocabularyRichness,
  score: number,
  interactionCount: number,
  knowledgeTransferScore?: number
}
```

### TrajectoryCard
```typescript
{
  direction: 'accelerating' | 'steady' | 'plateauing' | 'declining',
  metric: string,
  currentValue: number,
  change: number,
  trend: number,
  recommendation?: string
}
```

## Helper Functions

### getExpertiseLevel
Calculates expertise level from score and interaction count:
```typescript
const level = getExpertiseLevel(75, 145);
// Returns: 'proficient'
```

### getVocabularyRichness
Determines vocabulary level from score:
```typescript
const vocab = getVocabularyRichness(72);
// Returns: 'advanced'
```

### calculateTrajectory
Calculates trajectory direction from change and velocity:
```typescript
const direction = calculateTrajectory(12.5, 2.3);
// Returns: 'accelerating'
```

## Styling Tips

### Consistent with Theme
All components use the existing Tailwind theme:
- Background colors: `bg-bg-secondary`, `bg-bg-tertiary`
- Text colors: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Border colors: `border-border-subtle`, `border-border-default`
- Score colors: `text-score-high`, `text-score-medium`, `text-score-low`

### Responsive Layouts
Use Tailwind grid utilities:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Components automatically adapt */}
</div>
```

## Troubleshooting

### Component Not Showing
1. Check imports: `import { ComponentName } from '@/components';`
2. Verify data structure matches expected props
3. Check console for TypeScript errors

### Data Not Displaying
1. Ensure data is not null/undefined
2. Check score ranges (should be 0-100)
3. Verify interaction counts are positive numbers

### Styling Issues
1. Confirm Tailwind theme is properly configured
2. Check for CSS conflicts with custom styles
3. Verify responsive classes are correct

## Next Steps

1. **Explore BehaviorsPage** - See the complete integration
2. **Read Component Docs** - Check `USAGE_PATTERNS_README.md` for details
3. **Review Visual Guide** - See `COMPONENT_VISUAL_GUIDE.md` for layouts
4. **Customize** - Adapt components for your specific needs

## Support Resources

- **Component Documentation**: `/components/USAGE_PATTERNS_README.md`
- **Implementation Summary**: `/DASHBOARD_ENHANCEMENTS_SUMMARY.md`
- **Visual Reference**: `/COMPONENT_VISUAL_GUIDE.md`
- **Example Integration**: `/pages/BehaviorsPage.tsx`

## Common Use Cases

### Adding to User Profile
```tsx
import { UsagePatterns, DomainExpertise, TrajectoryCard } from '@/components';

function UserProfile({ user }) {
  return (
    <div className="space-y-6">
      <UsagePatterns data={user.usageData} showHeatmap={true} />

      <div className="grid grid-cols-2 gap-4">
        <TrajectoryCard {...user.skillTrajectory} />
        <TrajectoryCard {...user.engagementTrajectory} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {user.domains.map(d => <DomainExpertise key={d.id} {...d} />)}
      </div>
    </div>
  );
}
```

### Adding to Team Dashboard
```tsx
import { TrajectoryBadge, ExpertiseBadge } from '@/components';

function TeamMemberCard({ member }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3>{member.name}</h3>
          <ExpertiseBadge level={member.topExpertise} size="sm" />
        </div>
        <TrajectoryBadge direction={member.trajectory} />
      </div>
    </div>
  );
}
```

### Adding to Leaderboard
```tsx
import { ExpertiseBadge, TrajectoryIndicator } from '@/components';

function LeaderboardRow({ user, rank }) {
  return (
    <tr>
      <td>{rank}</td>
      <td>{user.name}</td>
      <td><ExpertiseBadge level={user.level} size="sm" /></td>
      <td><TrajectoryIndicator direction={user.trend} size="sm" /></td>
      <td>{user.score}</td>
    </tr>
  );
}
```

## Best Practices

1. **Always provide data** - Don't render components without data
2. **Use helper functions** - They ensure consistent calculations
3. **Follow grid patterns** - Use 1/2/3 column layouts
4. **Add loading states** - Show skeletons while data loads
5. **Handle errors gracefully** - Display fallback UI when needed

---

Ready to get started? Check out `/pages/BehaviorsPage.tsx` for a complete working example!
