import { clsx } from 'clsx';

export type ExpertiseLevel = 'novice' | 'beginner' | 'competent' | 'proficient' | 'expert';
export type VocabularyRichness = 'basic' | 'advanced' | 'expert';

interface ExpertiseBadgeProps {
  level: ExpertiseLevel;
  domain?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

interface VocabularyIndicatorProps {
  level: VocabularyRichness;
  score?: number;
  size?: 'sm' | 'md';
}

interface DomainExpertiseProps {
  domain: string;
  expertiseLevel: ExpertiseLevel;
  vocabularyRichness: VocabularyRichness;
  score: number;
  interactionCount: number;
  knowledgeTransferScore?: number;
}

const EXPERTISE_CONFIG = {
  novice: {
    label: 'Novice',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    description: 'Limited AI usage in this domain',
  },
  beginner: {
    label: 'Beginner',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'Developing AI collaboration patterns',
  },
  competent: {
    label: 'Competent',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    description: 'Consistent AI collaboration patterns',
  },
  proficient: {
    label: 'Proficient',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    description: 'Strong AI collaboration patterns',
  },
  expert: {
    label: 'Expert',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Sophisticated AI collaboration patterns',
  },
};

const VOCABULARY_CONFIG = {
  basic: {
    label: 'Basic',
    color: 'text-gray-400',
    icon: '▪',
  },
  advanced: {
    label: 'Advanced',
    color: 'text-blue-400',
    icon: '▪▪',
  },
  expert: {
    label: 'Expert',
    color: 'text-purple-400',
    icon: '▪▪▪',
  },
};

export function ExpertiseBadge({ level, domain, size = 'md', showLabel = true }: ExpertiseBadgeProps) {
  const config = EXPERTISE_CONFIG[level];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        config.bgColor,
        config.color,
        config.borderColor,
        sizeClasses[size]
      )}
      title={config.description}
    >
      {showLabel && <span>{config.label}</span>}
      {domain && size !== 'sm' && (
        <span className="text-text-muted">·</span>
      )}
      {domain && size !== 'sm' && (
        <span className="text-text-secondary font-normal">{domain}</span>
      )}
    </div>
  );
}

export function VocabularyIndicator({ level, score, size = 'md' }: VocabularyIndicatorProps) {
  const config = VOCABULARY_CONFIG[level];

  return (
    <div className="inline-flex items-center gap-2">
      <div className={clsx('font-medium', config.color)}>
        <span className="text-xs">{config.icon}</span>
      </div>
      <div>
        <span className={clsx('text-xs font-medium', config.color)}>
          {config.label} Vocabulary
        </span>
        {score !== undefined && (
          <span className="text-xs text-text-muted ml-1">
            ({score.toFixed(0)})
          </span>
        )}
      </div>
    </div>
  );
}

export function DomainExpertise({
  domain,
  expertiseLevel,
  vocabularyRichness,
  score,
  interactionCount,
  knowledgeTransferScore,
}: DomainExpertiseProps) {
  const expertiseConfig = EXPERTISE_CONFIG[expertiseLevel];

  return (
    <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle hover:border-border-default transition-colors">
      {/* Header with Domain Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-text-primary mb-1">
            {domain}
          </h4>
          <p className="text-xs text-text-muted">
            {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <div className={clsx('text-2xl font-bold', expertiseConfig.color)}>
            {score.toFixed(0)}
          </div>
          <p className="text-xs text-text-muted">Score</p>
        </div>
      </div>

      {/* Expertise Level Badge */}
      <div className="flex items-center gap-3 mb-3">
        <ExpertiseBadge level={expertiseLevel} size="sm" showLabel={true} />
        <VocabularyIndicator level={vocabularyRichness} size="sm" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">AI Collaboration Level</span>
          <span className="text-text-secondary">{expertiseConfig.label}</span>
        </div>
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full', expertiseConfig.bgColor.replace('/10', ''))}
            style={{ width: `${Math.min((score / 100) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Cross-Domain Consistency Score */}
      {knowledgeTransferScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Cross-Domain Consistency</span>
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-primary"
                  style={{ width: `${knowledgeTransferScore}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-primary">
                {knowledgeTransferScore.toFixed(0)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Patterns {knowledgeTransferScore >= 70 ? 'consistent' : knowledgeTransferScore >= 50 ? 'moderately consistent' : 'varying'} across domains
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to determine expertise level from score
export function getExpertiseLevel(score: number, interactionCount: number): ExpertiseLevel {
  if (interactionCount < 10) return 'novice';
  if (score >= 85) return 'expert';
  if (score >= 70) return 'proficient';
  if (score >= 50) return 'competent';
  if (score >= 30) return 'beginner';
  return 'novice';
}

// Helper function to determine vocabulary richness
export function getVocabularyRichness(score: number): VocabularyRichness {
  if (score >= 75) return 'expert';
  if (score >= 50) return 'advanced';
  return 'basic';
}
