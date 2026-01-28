import { useState } from 'react';
import { clsx } from 'clsx';
import { BASELINE_PROMPT } from '@/lib/baseline-prompt';
import type { DecodedAssessment } from '@/types/baseline';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Score Gauge Component
function ScoreGauge({ score, label, size = 'lg' }: { score: number; label: string; size?: 'sm' | 'lg' }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const isLarge = size === 'lg';

  return (
    <div className={clsx('flex flex-col items-center', isLarge ? 'gap-2' : 'gap-1')}>
      <div className={clsx('relative', isLarge ? 'w-32 h-32' : 'w-20 h-20')}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx('font-bold', getScoreColor(score), isLarge ? 'text-3xl' : 'text-xl')}>
            {score}
          </span>
        </div>
      </div>
      <span className={clsx('text-gray-400', isLarge ? 'text-sm' : 'text-xs')}>{label}</span>
    </div>
  );
}

// Score Bar Component
function ScoreBar({ label, score, subLabel }: { label: string; score: number; subLabel?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className={clsx('font-medium', getScoreColor(score))}>{score}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', getScoreBgColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
    </div>
  );
}

// Copy Prompt Section
function CopyPromptSection({ onCopied }: { onCopied: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(BASELINE_PROMPT);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onCopied();
    }, 1500);
  };

  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">AI Collaboration Assessment</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Get a personalized analysis of how effectively you collaborate with AI tools.
          Takes about 2 minutes.
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-[#7877df] flex items-center justify-center text-white font-bold">
            1
          </div>
          <div>
            <h3 className="font-semibold text-white">Copy the assessment prompt</h3>
            <p className="text-sm text-gray-400">Click the button below to copy</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
            2
          </div>
          <div>
            <h3 className="font-semibold text-gray-300">Paste into ChatGPT, Claude, or Gemini</h3>
            <p className="text-sm text-gray-500">The AI will analyze your conversation history</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
            3
          </div>
          <div>
            <h3 className="font-semibold text-gray-300">Return here with the encoded output</h3>
            <p className="text-sm text-gray-500">Paste it to see your personalized report</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={clsx(
            'w-full py-4 rounded-lg font-semibold text-lg transition-all',
            copied
              ? 'bg-green-600 text-white'
              : 'bg-[#7877df] hover:bg-[#6665c9] text-white'
          )}
        >
          {copied ? 'Copied! Now paste in your AI tool...' : 'Copy Assessment Prompt'}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Works with ChatGPT, Claude, and Gemini. Your data stays private.
      </p>
    </div>
  );
}

// Decode Section
function DecodeSection({
  onBack,
  onSubmitted,
}: {
  onBack: () => void;
  onSubmitted: (data: DecodedAssessment) => void;
}) {
  const [encodedData, setEncodedData] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accept new CRX1: format or legacy formats with substantial base64
  const hasCrxFormat = /CRX1:[A-Za-z0-9+/=]+/.test(encodedData);
  const hasLegacyBase64 = /[A-Za-z0-9+/]{100,}/.test(encodedData);
  const isValidFormat = hasCrxFormat || hasLegacyBase64;

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/baseline/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, encodedData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assessment');
      }

      onSubmitted(data.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <span>←</span> Back to instructions
      </button>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Paste Your Assessment</h2>
        <p className="text-gray-400">
          Copy the entire output from your AI tool and paste it below.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Encoded Assessment Output
          </label>
          <textarea
            value={encodedData}
            onChange={(e) => setEncodedData(e.target.value)}
            placeholder="Paste the output from ChatGPT, Claude, or Gemini here..."
            className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7877df] font-mono text-sm"
          />
          {encodedData && !isValidFormat && (
            <p className="text-red-400 text-sm mt-2">
              Paste the entire line starting with CRX1: from your AI tool.
            </p>
          )}
          {isValidFormat && (
            <p className="text-green-400 text-sm mt-2">Ready to decode</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7877df]"
          />
          <p className="text-gray-500 text-sm mt-1">
            We'll send you a copy of your results
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValidFormat || !email || isLoading}
          className={clsx(
            'w-full py-4 rounded-lg font-semibold text-lg transition-all',
            isValidFormat && email && !isLoading
              ? 'bg-[#7877df] hover:bg-[#6665c9] text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
        >
          {isLoading ? 'Analyzing...' : 'View My Results'}
        </button>
      </div>
    </div>
  );
}

// Report Display
function ReportDisplay({
  assessment,
  onReset,
}: {
  assessment: DecodedAssessment;
  onReset: () => void;
}) {
  const { scores, modes, domains, observations, usage } = assessment;

  const expertiseLabels: Record<string, string> = {
    novice: 'Novice',
    advanced_beginner: 'Advanced Beginner',
    competent: 'Competent',
    proficient: 'Proficient',
    expert: 'Expert',
  };

  const modeLabels: Record<string, string> = {
    approving: 'Approving',
    consulting: 'Consulting',
    supervising: 'Supervising',
    delegating: 'Delegating',
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Your Corrix Assessment</h1>
        <p className="text-gray-400">
          Based on your AI collaboration patterns
        </p>
      </div>

      {/* Overall Score */}
      <div className="bg-gray-800 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <ScoreGauge score={scores.overall} label="Overall Corrix Score" size="lg" />
          <div className="flex gap-6">
            <ScoreGauge score={scores.results.overall} label="Results" size="sm" />
            <ScoreGauge score={scores.relationship.overall} label="Relationship" size="sm" />
            <ScoreGauge score={scores.resilience.overall} label="Resilience" size="sm" />
          </div>
        </div>
      </div>

      {/* Three Rs Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Results */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className={clsx('w-3 h-3 rounded-full', getScoreBgColor(scores.results.overall))} />
            Results
          </h3>
          <ScoreBar label="Decision Quality" score={scores.results.decision_quality} />
          <ScoreBar label="Output Accuracy" score={scores.results.output_accuracy} />
          <ScoreBar label="Efficiency" score={scores.results.efficiency} />
        </div>

        {/* Relationship */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className={clsx('w-3 h-3 rounded-full', getScoreBgColor(scores.relationship.overall))} />
            Relationship
          </h3>
          <ScoreBar label="Appropriateness" score={scores.relationship.appropriateness_of_reliance} />
          <ScoreBar label="Trust Calibration" score={scores.relationship.trust_calibration} />
          <ScoreBar label="Dialogue Quality" score={scores.relationship.dialogue_quality} />
        </div>

        {/* Resilience */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className={clsx('w-3 h-3 rounded-full', getScoreBgColor(scores.resilience.overall))} />
            Resilience
          </h3>
          <ScoreBar label="Cognitive Sustainability" score={scores.resilience.cognitive_sustainability} />
          <ScoreBar label="Skill Trajectory" score={scores.resilience.skill_trajectory} />
          <ScoreBar label="Expertise Preservation" score={scores.resilience.expertise_preservation} />
        </div>
      </div>

      {/* Collaboration Modes */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Collaboration Mode Distribution</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400">Primary Mode:</span>
          <span className="bg-[#7877df] text-white px-3 py-1 rounded-full text-sm font-medium">
            {modeLabels[modes.primary]}
          </span>
          <span className="text-gray-500 text-sm ml-2">
            Mode Switching Awareness: {modes.switching_awareness}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'approving', pct: modes.approving_pct },
            { key: 'consulting', pct: modes.consulting_pct },
            { key: 'supervising', pct: modes.supervising_pct },
            { key: 'delegating', pct: modes.delegating_pct },
          ].map(({ key, pct }) => (
            <div key={key} className="text-center">
              <div className="h-24 bg-gray-700 rounded-lg flex items-end justify-center p-2">
                <div
                  className="w-full bg-[#7877df] rounded transition-all"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{modeLabels[key]}</p>
              <p className="text-lg font-semibold text-white">{pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Domains */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Domain-Specific Analysis</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {domains.map((domain, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white">{domain.name}</h4>
                  <p className="text-sm text-gray-400">{domain.pct}% of usage</p>
                </div>
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {expertiseLabels[domain.expertise]}
                </span>
              </div>
              <div className="space-y-2">
                <ScoreBar label="Results" score={domain.results} />
                <ScoreBar label="Relationship" score={domain.relationship} />
                <ScoreBar label="Resilience" score={domain.resilience} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Patterns */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Usage Patterns</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{usage.weekly_hours_estimate}</p>
            <p className="text-sm text-gray-400">Hours/Week</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-white">{usage.weekly_interactions_estimate}</p>
            <p className="text-sm text-gray-400">Interactions/Week</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-white capitalize">{usage.peak_time}</p>
            <p className="text-sm text-gray-400">Peak Time</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className="text-2xl font-bold text-white capitalize">{usage.learning_trajectory}</p>
            <p className="text-sm text-gray-400">Learning Trajectory</p>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-3">Strengths</h3>
          <p className="text-gray-300">{observations.strengths}</p>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">Growth Opportunities</h3>
          <p className="text-gray-300">{observations.growth_opportunities}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Insights</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="text-[#7877df]">Mode:</span>
            <span className="text-gray-300">{observations.mode_insight}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-[#7877df]">Domain:</span>
            <span className="text-gray-300">{observations.domain_insight}</span>
          </div>
          {observations.risk_flag && observations.risk_flag !== 'None detected' && (
            <div className="flex gap-3 bg-red-900/30 p-3 rounded-lg">
              <span className="text-red-400">Risk:</span>
              <span className="text-gray-300">{observations.risk_flag}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-[#7877df]/20 border border-[#7877df]/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">This Week's Recommendations</h3>
        <ol className="space-y-3">
          {observations.recommendations.map((rec, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#7877df] text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-gray-300">{rec}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 py-8">
        <p className="text-gray-400">
          Want to track your collaboration over time?
        </p>
        <a
          href="https://corrix.ai/beta"
          className="inline-block bg-[#7877df] hover:bg-[#6665c9] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Get Corrix
        </a>
        <div className="pt-4">
          <button
            onClick={onReset}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Take another assessment
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function BaselinePage() {
  const [step, setStep] = useState<'copy' | 'paste' | 'report'>('copy');
  const [assessment, setAssessment] = useState<DecodedAssessment | null>(null);

  const handleAssessmentSubmitted = (data: DecodedAssessment) => {
    setAssessment(data);
    setStep('report');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="https://corrix.ai" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7877df] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Cx</span>
            </div>
            <span className="font-semibold text-white">Corrix</span>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {step === 'copy' && <CopyPromptSection onCopied={() => setStep('paste')} />}
        {step === 'paste' && (
          <DecodeSection
            onBack={() => setStep('copy')}
            onSubmitted={handleAssessmentSubmitted}
          />
        )}
        {step === 'report' && assessment && (
          <ReportDisplay
            assessment={assessment}
            onReset={() => {
              setAssessment(null);
              setStep('copy');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
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
