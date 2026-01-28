import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { getCredential } from '@/api/credential';
import type { Credential, QualificationRating } from '@/types/credential';
import { getRatingColor, getRatingLabel, getRatingDescription } from '@/types/credential';

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Rating Badge Component
function RatingBadge({ rating, size = 'lg' }: { rating: QualificationRating; size?: 'sm' | 'lg' }) {
  const color = getRatingColor(rating);
  const label = getRatingLabel(rating);
  const isLarge = size === 'lg';

  return (
    <div
      className={clsx(
        'rounded-lg font-semibold text-center inline-block',
        isLarge ? 'px-6 py-3 text-xl' : 'px-4 py-2 text-sm'
      )}
      style={{ backgroundColor: color, color: 'white' }}
    >
      {label}
    </div>
  );
}

// Score Bar Component
function ScoreBar({ label, score, description }: { label: string; score: number; description?: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={clsx('text-sm font-semibold', getScoreColor(score))}>{score}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', getScoreBgColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}

// Mode Bar Component
function ModeBar({ label, percentage, isPrimary }: { label: string; percentage: number; isPrimary: boolean }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className={clsx('text-sm', isPrimary ? 'text-[#7877df] font-semibold' : 'text-gray-400')}>
          {label} {isPrimary && '(Primary)'}
        </span>
        <span className="text-sm text-gray-400">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full', isPrimary ? 'bg-[#7877df]' : 'bg-gray-500')}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}

// Metric explanation lookup
const metricExplanations = {
  // Results
  decision_quality: 'How well you evaluate AI suggestions before acting on them',
  output_accuracy: 'The correctness and quality of work produced with AI assistance',
  efficiency: 'Time and effort optimization when working with AI tools',
  // Relationship
  appropriateness_of_reliance: 'Whether you rely on AI for tasks where it excels and maintain control where it doesn\'t',
  trust_calibration: 'How well your trust in AI matches its actual capabilities',
  dialogue_quality: 'The effectiveness of your prompts and interaction patterns',
  // Resilience
  cognitive_sustainability: 'Maintaining critical thinking and mental engagement while using AI',
  skill_trajectory: 'Whether your skills are growing, stable, or declining with AI use',
  expertise_preservation: 'Retaining and developing domain expertise alongside AI use',
};

// Mode descriptions
const modeDescriptions = {
  approving: 'You primarily select from AI-generated options, using AI as a solution generator',
  consulting: 'You seek AI input while making your own decisions, treating AI as an advisor',
  supervising: 'AI drafts and you refine, maintaining close oversight of AI output',
  delegating: 'AI works autonomously on tasks with your high-level direction',
};

// Domain expertise labels
const expertiseLabels: Record<string, { label: string; color: string }> = {
  novice: { label: 'Novice', color: 'bg-gray-500' },
  advanced_beginner: { label: 'Advanced Beginner', color: 'bg-blue-500' },
  competent: { label: 'Competent', color: 'bg-yellow-500' },
  proficient: { label: 'Proficient', color: 'bg-green-500' },
  expert: { label: 'Expert', color: 'bg-purple-500' },
};

// Score benchmark helper
function getScoreBenchmark(score: number): { label: string; description: string; color: string } {
  if (score >= 85) return { label: 'Exceptional', description: 'Top 10% of professionals', color: 'text-green-400' };
  if (score >= 75) return { label: 'Strong', description: 'Top 25% of professionals', color: 'text-blue-400' };
  if (score >= 65) return { label: 'Proficient', description: 'Above average', color: 'text-[#7877df]' };
  if (score >= 50) return { label: 'Developing', description: 'Room for growth', color: 'text-yellow-400' };
  return { label: 'Emerging', description: 'Early stage', color: 'text-red-400' };
}

// Percentile visual component
function PercentileBar({ percentile, score }: { percentile: number | null; score: number }) {
  const benchmark = getScoreBenchmark(score);
  const displayPercentile = percentile || Math.min(99, Math.max(1, Math.round(score * 0.9)));

  return (
    <div className="mt-4 bg-gray-700/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Percentile Ranking</span>
        <span className={clsx('text-sm font-semibold', benchmark.color)}>{benchmark.label}</span>
      </div>
      <div className="relative h-3 bg-gray-600 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 via-[#7877df] to-green-500 opacity-30"
          style={{ width: '100%' }}
        />
        <div
          className="absolute h-full bg-[#7877df] rounded-full transition-all"
          style={{ width: `${displayPercentile}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-[#7877df]"
          style={{ left: `calc(${displayPercentile}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">0%</span>
        <span className="text-xs text-gray-400 font-medium">
          Scored higher than {displayPercentile}% of professionals
        </span>
        <span className="text-xs text-gray-500">100%</span>
      </div>
    </div>
  );
}

// Score card with benchmark
function ScoreCardWithBenchmark({ score, label, weight }: { score: number; label: string; weight: string }) {
  const benchmark = getScoreBenchmark(score);
  return (
    <div className="text-center p-4 bg-gray-700/50 rounded-lg">
      <p className={clsx('text-3xl font-bold', getScoreColor(score))}>
        {score}
      </p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      <p className={clsx('text-xs mt-1', benchmark.color)}>{benchmark.label}</p>
      <p className="text-xs text-gray-500">{weight} weight</p>
    </div>
  );
}

// Loading State
function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 border-4 border-[#7877df] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-gray-400 mt-4">Loading credential...</p>
    </div>
  );
}

// Error State
function ErrorState({ error }: { error: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white">Credential Not Found</h2>
      <p className="text-gray-400">{error}</p>
      <a
        href="/assessment"
        className="inline-block mt-4 bg-[#7877df] hover:bg-[#6665c9] text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Get Your Credential
      </a>
    </div>
  );
}

// Invalid/Expired State
function InvalidState({ credential }: { credential: Credential }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white">Credential Expired</h2>
      <p className="text-gray-400">
        This credential ({credential.credential_id}) expired on{' '}
        {new Date(credential.expires_at).toLocaleDateString()}
      </p>
      <a
        href="/assessment"
        className="inline-block mt-4 bg-[#7877df] hover:bg-[#6665c9] text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Get a New Credential
      </a>
    </div>
  );
}

// Valid Credential Display - EXPANDED VERSION
function ValidCredential({ credential }: { credential: Credential }) {
  const issuedDate = new Date(credential.issued_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const expiresDate = new Date(credential.expires_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const primaryMode = credential.mode_primary?.toLowerCase() || 'consulting';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Verification Badge */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-400">Verified Credential</h2>
          <p className="text-gray-400">This credential is valid and authentic</p>
        </div>
      </div>

      {/* Main Credential Card */}
      <div className="bg-gray-800 rounded-xl p-6 md:p-8">
        {/* Holder Name */}
        {credential.holder_name && (
          <div className="text-center border-b border-gray-700 pb-6 mb-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Credential Holder</p>
            <p className="text-2xl font-bold text-white mt-1">{credential.holder_name}</p>
          </div>
        )}

        {/* Rating & Overall Score */}
        <div className="text-center mb-8">
          <RatingBadge rating={credential.qualification_rating} size="lg" />
          <p className="text-gray-400 text-sm mt-3 max-w-md mx-auto">
            {getRatingDescription(credential.qualification_rating)}
          </p>

          <div className="mt-6">
            <p className={clsx('text-6xl font-bold', getScoreColor(credential.calibrated_overall_score))}>
              {credential.calibrated_overall_score}
            </p>
            <p className="text-gray-400 text-sm mt-1">Overall Score</p>
          </div>

          {/* Percentile Bar */}
          <PercentileBar percentile={credential.percentile} score={credential.calibrated_overall_score} />
        </div>

        {/* Three Rs Overview with Benchmarks */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ScoreCardWithBenchmark score={credential.results_overall} label="Results" weight="30%" />
          <ScoreCardWithBenchmark score={credential.relationship_overall} label="Relationship" weight="40%" />
          <ScoreCardWithBenchmark score={credential.resilience_overall} label="Resilience" weight="30%" />
        </div>

        {/* Profile Type */}
        <div className="text-center border-b border-gray-700 pb-6 mb-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Profile Type</p>
          <p className="text-xl font-semibold text-white mt-1">{credential.profile_type}</p>
          {credential.profile_description && (
            <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">{credential.profile_description}</p>
          )}
        </div>

        {/* Assessment Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Credential ID</p>
            <p className="font-mono text-white text-xs">{credential.credential_id}</p>
          </div>
          <div>
            <p className="text-gray-500">Platform</p>
            <p className="text-white capitalize">{credential.platform_detected}</p>
          </div>
          <div>
            <p className="text-gray-500">Issued</p>
            <p className="text-white">{issuedDate}</p>
          </div>
          <div>
            <p className="text-gray-500">Valid Until</p>
            <p className="text-white">{expiresDate}</p>
          </div>
        </div>
      </div>

      {/* Detailed Three Rs Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Results */}
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader
            title="Results"
            subtitle="Are you getting better outcomes?"
          />
          <p className="text-xs text-gray-500 mb-4">
            Measures whether AI collaboration produces better work outcomes through improved decisions, accuracy, and efficiency.
          </p>
          <ScoreBar
            label="Decision Quality"
            score={credential.results_decision_quality}
            description={metricExplanations.decision_quality}
          />
          <ScoreBar
            label="Output Accuracy"
            score={credential.results_output_accuracy}
            description={metricExplanations.output_accuracy}
          />
          <ScoreBar
            label="Efficiency"
            score={credential.results_efficiency}
            description={metricExplanations.efficiency}
          />
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Results Score</span>
              <span className={clsx('text-xl font-bold', getScoreColor(credential.results_overall))}>
                {credential.results_overall}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Benchmark</span>
              <span className={clsx('text-xs font-medium', getScoreBenchmark(credential.results_overall).color)}>
                {getScoreBenchmark(credential.results_overall).label} — {getScoreBenchmark(credential.results_overall).description}
              </span>
            </div>
          </div>
        </div>

        {/* Relationship */}
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader
            title="Relationship"
            subtitle="Is your collaboration healthy?"
          />
          <p className="text-xs text-gray-500 mb-4">
            Evaluates the health of human-AI collaboration patterns including appropriate reliance and trust calibration.
          </p>
          <ScoreBar
            label="Reliance Balance"
            score={credential.relationship_appropriateness_of_reliance}
            description={metricExplanations.appropriateness_of_reliance}
          />
          <ScoreBar
            label="Trust Calibration"
            score={credential.relationship_trust_calibration}
            description={metricExplanations.trust_calibration}
          />
          <ScoreBar
            label="Dialogue Quality"
            score={credential.relationship_dialogue_quality}
            description={metricExplanations.dialogue_quality}
          />
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Relationship Score</span>
              <span className={clsx('text-xl font-bold', getScoreColor(credential.relationship_overall))}>
                {credential.relationship_overall}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Benchmark</span>
              <span className={clsx('text-xs font-medium', getScoreBenchmark(credential.relationship_overall).color)}>
                {getScoreBenchmark(credential.relationship_overall).label} — {getScoreBenchmark(credential.relationship_overall).description}
              </span>
            </div>
          </div>
        </div>

        {/* Resilience */}
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader
            title="Resilience"
            subtitle="Are you staying sharp?"
          />
          <p className="text-xs text-gray-500 mb-4">
            Assesses long-term sustainability of AI collaboration including skill development and expertise preservation.
          </p>
          <ScoreBar
            label="Cognitive Sustainability"
            score={credential.resilience_cognitive_sustainability}
            description={metricExplanations.cognitive_sustainability}
          />
          <ScoreBar
            label="Skill Trajectory"
            score={credential.resilience_skill_trajectory}
            description={metricExplanations.skill_trajectory}
          />
          <ScoreBar
            label="Expertise Preservation"
            score={credential.resilience_expertise_preservation}
            description={metricExplanations.expertise_preservation}
          />
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Resilience Score</span>
              <span className={clsx('text-xl font-bold', getScoreColor(credential.resilience_overall))}>
                {credential.resilience_overall}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">Benchmark</span>
              <span className={clsx('text-xs font-medium', getScoreBenchmark(credential.resilience_overall).color)}>
                {getScoreBenchmark(credential.resilience_overall).label} — {getScoreBenchmark(credential.resilience_overall).description}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Mode Analysis */}
      <div className="bg-gray-800 rounded-xl p-6">
        <SectionHeader
          title="Collaboration Mode"
          subtitle="How you work with AI"
        />
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-4">
              {modeDescriptions[primaryMode as keyof typeof modeDescriptions] || 'Your primary mode of AI collaboration'}
            </p>
            <ModeBar
              label="Approving"
              percentage={credential.mode_approving_pct}
              isPrimary={primaryMode === 'approving'}
            />
            <ModeBar
              label="Consulting"
              percentage={credential.mode_consulting_pct}
              isPrimary={primaryMode === 'consulting'}
            />
            <ModeBar
              label="Supervising"
              percentage={credential.mode_supervising_pct}
              isPrimary={primaryMode === 'supervising'}
            />
            <ModeBar
              label="Delegating"
              percentage={credential.mode_delegating_pct}
              isPrimary={primaryMode === 'delegating'}
            />
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">What the modes mean</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <p><span className="text-gray-300 font-medium">Approving:</span> Selecting from AI-generated options</p>
              <p><span className="text-gray-300 font-medium">Consulting:</span> Seeking AI input while making own decisions</p>
              <p><span className="text-gray-300 font-medium">Supervising:</span> AI drafts, you refine and improve</p>
              <p><span className="text-gray-300 font-medium">Delegating:</span> AI works autonomously on tasks</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-600">
              <p className="text-xs text-gray-500">
                Mode Switching Awareness: <span className="text-gray-300 capitalize">{credential.mode_switching_awareness}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Effective collaborators adapt their mode based on task requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Expertise */}
      {credential.domains && credential.domains.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader
            title="Domain Expertise"
            subtitle="Performance across your areas of focus"
          />
          <div className="grid md:grid-cols-3 gap-4">
            {credential.domains.map((domain, index) => {
              const expertise = expertiseLabels[domain.domain_expertise] || expertiseLabels.competent;
              return (
                <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-white">{domain.domain_name}</h4>
                    <span className={clsx('text-xs px-2 py-0.5 rounded', expertise.color, 'text-white')}>
                      {expertise.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{domain.domain_pct}% of your AI usage</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Results</span>
                      <span className={getScoreColor(domain.domain_results)}>{domain.domain_results}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Relationship</span>
                      <span className={getScoreColor(domain.domain_relationship)}>{domain.domain_relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resilience</span>
                      <span className={getScoreColor(domain.domain_resilience)}>{domain.domain_resilience}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Growth Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader title="Key Strengths" />
          {credential.strengths && credential.strengths.length > 0 ? (
            <ul className="space-y-2">
              {credential.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          ) : credential.obs_strengths ? (
            <p className="text-sm text-gray-300">{credential.obs_strengths}</p>
          ) : (
            <p className="text-sm text-gray-500">No specific strengths identified</p>
          )}
        </div>

        {/* Growth Areas */}
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader title="Growth Opportunities" />
          {credential.growth_areas && credential.growth_areas.length > 0 ? (
            <ul className="space-y-2">
              {credential.growth_areas.map((area, index) => (
                <li key={index} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm text-gray-300">{area}</span>
                </li>
              ))}
            </ul>
          ) : credential.obs_growth_opportunities ? (
            <p className="text-sm text-gray-300">{credential.obs_growth_opportunities}</p>
          ) : (
            <p className="text-sm text-gray-500">No specific growth areas identified</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {credential.recommendations && credential.recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <SectionHeader
            title="Recommendations"
            subtitle="Actionable steps to improve your AI collaboration"
          />
          <div className="grid md:grid-cols-3 gap-4">
            {credential.recommendations.map((rec, index) => (
              <div key={index} className="bg-[#7877df]/10 border border-[#7877df]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-[#7877df] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-xs text-[#7877df] uppercase tracking-wide">Recommendation</span>
                </div>
                <p className="text-sm text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Corrix */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-3">About the Corrix Assessment</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div>
            <h4 className="text-white font-medium mb-1">The Three Rs Framework</h4>
            <p>Corrix evaluates AI collaboration using Results (30%), Relationship (40%), and Resilience (30%) - a research-based methodology for sustainable human-AI partnership.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Cross-Platform Calibration</h4>
            <p>Scores are calibrated across AI platforms (ChatGPT, Claude, Gemini) to ensure fair comparison regardless of which tools you use.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Benchmarking</h4>
            <p>Percentiles are calculated against our growing database of professionals across industries and roles.</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-gray-500 text-sm">
            Conversations analyzed: <span className="text-white">{credential.conversation_count_analyzed}</span>
          </p>
          <a
            href="/assessment"
            className="text-[#7877df] hover:underline text-sm"
          >
            Get your own credential →
          </a>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function CredentialVerifyPage() {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);

  useEffect(() => {
    if (!credentialId) {
      setError('No credential ID provided');
      setLoading(false);
      return;
    }

    const fetchCredential = async () => {
      try {
        // Use the full credential endpoint to get all data
        const data = await getCredential(credentialId);
        setCredential(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify credential');
      } finally {
        setLoading(false);
      }
    };

    fetchCredential();
  }, [credentialId]);

  // Check if expired
  const isExpired = credential?.expires_at && new Date(credential.expires_at) < new Date();
  const isValid = credential?.is_verified && !isExpired;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <a href="https://corrix.ai" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Corrix" className="h-8 w-auto" />
            <span className="text-gray-500">/ Credential Verification</span>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {credential && !isValid && <InvalidState credential={credential} />}
        {credential && isValid && <ValidCredential credential={credential} />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>
            Corrix is built by{' '}
            <a href="https://human-machines.com" className="text-[#7877df] hover:underline">
              Human Machines
            </a>
          </p>
          <p className="mt-1">The Collaboration Results Index</p>
        </div>
      </footer>
    </div>
  );
}
