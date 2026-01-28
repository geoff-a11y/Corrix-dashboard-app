import { View, Text } from '@react-pdf/renderer';
import { styles, colors, getScoreColor, getRatingColor } from './pdf-styles';

// Score Circle Component
interface ScoreCircleProps {
  score: number;
  label: string;
  size?: 'small' | 'large';
}

export function ScoreCircle({ score, label, size = 'small' }: ScoreCircleProps) {
  const color = getScoreColor(score);
  const isLarge = size === 'large';

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={[
          isLarge ? styles.scoreCircleLarge : styles.scoreCircle,
          { borderColor: color },
        ]}
      >
        <Text style={[isLarge ? styles.scoreValueLarge : styles.scoreValue, { color }]}>
          {score}
        </Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
}

// Score Bar Component
interface ScoreBarProps {
  label: string;
  score: number;
  description?: string;
}

export function ScoreBar({ label, score, description }: ScoreBarProps) {
  const color = getScoreColor(score);

  return (
    <View style={styles.mb8}>
      <View style={styles.scoreBarLabel}>
        <Text style={styles.bodySmall}>{label}</Text>
        <Text style={[styles.bodySmall, { color, fontWeight: 600 }]}>{score}</Text>
      </View>
      <View style={styles.scoreBar}>
        <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      {description && (
        <Text style={[styles.bodySmall, { marginTop: 2, color: colors.textMuted }]}>
          {description}
        </Text>
      )}
    </View>
  );
}

// Rating Badge Component
interface RatingBadgeProps {
  rating: string;
  size?: 'small' | 'large';
}

export function RatingBadge({ rating, size = 'large' }: RatingBadgeProps) {
  const color = getRatingColor(rating);
  const label = rating.charAt(0).toUpperCase() + rating.slice(1);

  return (
    <View style={[styles.ratingBadge, { backgroundColor: color }]}>
      <Text
        style={[styles.ratingBadgeText, { fontSize: size === 'large' ? 14 : 10 }]}
      >
        {label}
      </Text>
    </View>
  );
}

// Mode Distribution Component
interface ModeDistributionProps {
  modes: {
    approving: number;
    consulting: number;
    supervising: number;
    delegating: number;
  };
  primary: string;
}

export function ModeDistribution({ modes, primary }: ModeDistributionProps) {
  const modeItems = [
    { key: 'approving', label: 'Approving', value: modes.approving },
    { key: 'consulting', label: 'Consulting', value: modes.consulting },
    { key: 'supervising', label: 'Supervising', value: modes.supervising },
    { key: 'delegating', label: 'Delegating', value: modes.delegating },
  ];

  return (
    <View style={styles.modeContainer}>
      {modeItems.map((mode) => (
        <View key={mode.key} style={styles.modeBar}>
          <View style={styles.modeBarTrack}>
            <View
              style={[
                styles.modeBarFill,
                {
                  height: `${mode.value}%`,
                  backgroundColor: mode.key === primary ? colors.primary : '#4B5563',
                },
              ]}
            />
          </View>
          <Text style={styles.modeLabel}>{mode.label}</Text>
          <Text style={styles.modeValue}>{mode.value}%</Text>
        </View>
      ))}
    </View>
  );
}

// Bullet List Component
interface BulletListProps {
  items: string[];
  color?: string;
}

export function BulletList({ items, color = colors.primary }: BulletListProps) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <View style={[styles.listBullet, { backgroundColor: color }]} />
          <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// Numbered List Component
interface NumberedListProps {
  items: string[];
}

export function NumberedList({ items }: NumberedListProps) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <View style={styles.listNumber}>
            <Text style={styles.listNumberText}>{index + 1}</Text>
          </View>
          <Text style={[styles.body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// Domain Card Component
interface DomainCardProps {
  name: string;
  percentage: number;
  expertise: string;
  results: number;
  relationship: number;
  resilience: number;
}

export function DomainCard({
  name,
  percentage,
  expertise,
  results,
  relationship,
  resilience,
}: DomainCardProps) {
  const expertiseLabels: Record<string, string> = {
    novice: 'Novice',
    advanced_beginner: 'Advanced Beginner',
    competent: 'Competent',
    proficient: 'Proficient',
    expert: 'Expert',
  };

  return (
    <View style={styles.cardSmall}>
      <View style={[styles.row, styles.spaceBetween, styles.mb8]}>
        <View>
          <Text style={[styles.body, { fontWeight: 600 }]}>{name}</Text>
          <Text style={styles.bodySmall}>{percentage}% of usage</Text>
        </View>
        <View
          style={{
            backgroundColor: '#374151',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: 8, color: colors.textSecondary }}>
            {expertiseLabels[expertise] || expertise}
          </Text>
        </View>
      </View>
      <ScoreBar label="Results" score={results} />
      <ScoreBar label="Relationship" score={relationship} />
      <ScoreBar label="Resilience" score={resilience} />
    </View>
  );
}

// Interview Probe Component
interface InterviewProbeProps {
  area: string;
  probe: string;
  rationale: string;
}

export function InterviewProbe({ area, probe, rationale }: InterviewProbeProps) {
  return (
    <View style={styles.probeCard}>
      <Text style={styles.probeArea}>{area}</Text>
      <Text style={styles.probeQuestion}>{probe}</Text>
      <Text style={styles.probeRationale}>{rationale}</Text>
    </View>
  );
}

// Section Title Component
interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View style={styles.mb16}>
      <Text style={styles.h2}>{title}</Text>
      {subtitle && <Text style={styles.bodySmall}>{subtitle}</Text>}
    </View>
  );
}

// Stats Grid Component
interface StatsGridProps {
  stats: Array<{ value: string | number; label: string }>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <View style={styles.grid2}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.cardSmall,
            { alignItems: 'center', paddingVertical: 12 },
          ]}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
            {stat.value}
          </Text>
          <Text style={[styles.bodySmall, { marginTop: 2 }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
