import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { CREDENTIAL_PROMPT } from '@/lib/credential-prompt';
import { generateCredential, getCredential } from '@/api/credential';
import type { CredentialGenerateResponse, QualificationRating, Credential } from '@/types/credential';
import { getRatingColor, getRatingLabel, getRatingDescription } from '@/types/credential';

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

// Copy Prompt Section
function CopyPromptSection({ onCopied }: { onCopied: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CREDENTIAL_PROMPT);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onCopied();
    }, 1500);
  };

  return (
    <div className="text-center space-y-8">
      {/* Hero Section */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">AI Collaboration Assessment</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Get a professional credential and advice on your AI collaboration skills.
        </p>
        <p className="text-sm text-[#7877df] font-medium">
          Takes about 2 minutes
        </p>
      </div>

      {/* Credibility Bar */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Research-backed methodology
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verifiable credentials
        </span>
      </div>

      {/* Steps Card */}
      <div className="bg-gray-800 rounded-xl p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-[#7877df] flex items-center justify-center text-white font-bold shrink-0">
            1
          </div>
          <div>
            <h3 className="font-semibold text-white">Copy the assessment prompt</h3>
            <p className="text-sm text-gray-400">Click the button below to copy it to your clipboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold shrink-0">
            2
          </div>
          <div>
            <h3 className="font-semibold text-gray-300">Start a new chat and paste the prompt</h3>
            <p className="text-sm text-gray-500">
              Open ChatGPT, Claude, or Gemini in a new conversation and paste the prompt.
              The AI will analyze your recent collaboration patterns.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold shrink-0">
            3
          </div>
          <div>
            <h3 className="font-semibold text-gray-300">Come back and paste the result</h3>
            <p className="text-sm text-gray-500">
              Copy the AI's response (starts with CRX1:) and paste it here to generate your credential
            </p>
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

      {/* What You'll Get */}
      <div className="max-w-2xl mx-auto text-left bg-gray-800/50 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">What you'll receive:</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[#7877df] mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Qualification Rating</span>
                <p className="text-gray-500 text-xs">From Exceptional to Developing, calibrated against other professionals</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#7877df] mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Three Rs Analysis</span>
                <p className="text-gray-500 text-xs">Results (output quality), Relationship (collaboration style), Resilience (skill growth)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#7877df] mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Collaboration Profile</span>
                <p className="text-gray-500 text-xs">Your working style with AI tools (e.g., Strategic Consultant, Technical Collaborator)</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[#7877df] mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Personalized Recommendations</span>
                <p className="text-gray-500 text-xs">Specific advice to improve your AI collaboration effectiveness</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#7877df] mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">PDF Credential</span>
                <p className="text-gray-500 text-xs">Downloadable report to share with employers or add to your portfolio</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#7877df] mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Verification Link</span>
                <p className="text-gray-500 text-xs">Shareable URL so others can verify your credential is authentic</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          Works with ChatGPT, Claude, and Gemini. Your data stays private.
        </p>
        <p className="text-xs text-gray-600">
          Built by <a href="https://human-machines.com" className="text-[#7877df] hover:underline">Human Machines</a> using
          the Collaboration Results Index (Corrix) framework.
        </p>
      </div>
    </div>
  );
}

// Submit Section
function SubmitSection({
  onBack,
  onSubmitted,
}: {
  onBack: () => void;
  onSubmitted: (data: CredentialGenerateResponse['credential']) => void;
}) {
  const [encodedData, setEncodedData] = useState('');
  const [email, setEmail] = useState('');
  const [holderName, setHolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await generateCredential({
        email,
        encodedData,
        holderName: holderName || undefined,
      });

      if (!response.success) {
        throw new Error('Failed to generate credential');
      }

      onSubmitted(response.credential);
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
        <h2 className="text-2xl font-bold text-white">Generate Your Credential</h2>
        <p className="text-gray-400">
          Paste the output from your AI tool and enter your details.
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
            <p className="text-green-400 text-sm mt-2">Format validated</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7877df]"
          />
          <p className="text-gray-500 text-sm mt-1">
            Will appear on your credential and verification page
          </p>
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
            We'll send you a copy of your credential. We won't share your email or send marketing messages.
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
          {isLoading ? 'Generating Credential...' : 'Generate Credential'}
        </button>
      </div>
    </div>
  );
}

// Rating Badge Component
function RatingBadge({ rating, size = 'lg' }: { rating: QualificationRating; size?: 'sm' | 'lg' }) {
  const color = getRatingColor(rating);
  const label = getRatingLabel(rating);
  const isLarge = size === 'lg';

  return (
    <div
      className={clsx(
        'rounded-lg font-semibold text-center',
        isLarge ? 'px-6 py-3 text-xl' : 'px-4 py-2 text-sm'
      )}
      style={{ backgroundColor: color, color: 'white' }}
    >
      {label}
    </div>
  );
}

// PDF Download Button Component - uses dynamic import to avoid loading PDF library until needed
function PDFDownloadButton({
  credential,
  type,
}: {
  credential: Credential;
  type: 'full' | 'summary';
}) {
  const [PDFComponent, setPDFComponent] = useState<React.ComponentType<{ credential: Credential }> | null>(null);
  const [PDFLink, setPDFLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPDFComponents() {
      try {
        setError(null);
        const pdfRenderer = await import('@react-pdf/renderer');
        setPDFLink(() => pdfRenderer.PDFDownloadLink);

        if (type === 'full') {
          const mod = await import('@/components/pdf/FullReportPDF');
          setPDFComponent(() => mod.FullReportPDF);
        } else {
          const mod = await import('@/components/pdf/SummaryPDF');
          setPDFComponent(() => mod.SummaryPDF);
        }
      } catch (err) {
        console.error('Failed to load PDF components:', err);
        setError('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    }
    loadPDFComponents();
  }, [type]);

  const fileName = type === 'full'
    ? `Corrix-Credential-${credential.credential_id}.pdf`
    : `Corrix-Summary-${credential.credential_id}.pdf`;

  if (loading) {
    return (
      <button
        disabled
        className="py-3 px-4 bg-gray-700 text-gray-400 rounded-lg font-medium cursor-wait text-center block w-full"
      >
        Loading PDF...
      </button>
    );
  }

  if (error || !PDFComponent || !PDFLink) {
    return (
      <button
        disabled
        className="py-3 px-4 bg-red-900/50 text-red-400 rounded-lg font-medium text-center block w-full"
      >
        PDF unavailable
      </button>
    );
  }

  const PDFDownloadLink = PDFLink;
  const DocumentComponent = PDFComponent;

  return (
    <PDFDownloadLink
      document={<DocumentComponent credential={credential} />}
      fileName={fileName}
      style={{
        display: 'block',
        padding: '12px 16px',
        backgroundColor: '#7877df',
        color: 'white',
        borderRadius: '8px',
        fontWeight: 500,
        textAlign: 'center',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      {({ loading: pdfLoading, error: pdfError }: { loading: boolean; error: Error | null }) => {
        if (pdfError) {
          console.error('PDF generation error:', pdfError);
          return 'Error generating PDF';
        }
        return pdfLoading
          ? 'Preparing PDF...'
          : type === 'full'
            ? 'Download your full report'
            : 'Download shareable summary';
      }}
    </PDFDownloadLink>
  );
}

// Additional score helpers for credential detail
function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreBenchmark(score: number): { label: string; description: string; color: string } {
  if (score >= 85) return { label: 'Exceptional', description: 'Top 10%', color: 'text-green-400' };
  if (score >= 75) return { label: 'Strong', description: 'Top 25%', color: 'text-blue-400' };
  if (score >= 65) return { label: 'Proficient', description: 'Above average', color: 'text-[#7877df]' };
  if (score >= 50) return { label: 'Developing', description: 'Room for growth', color: 'text-yellow-400' };
  return { label: 'Emerging', description: 'Early stage', color: 'text-red-400' };
}

// Score Bar
function ScoreBar({ label, score, description }: { label: string; score: number; description?: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={clsx('text-sm font-semibold', getScoreColor(score))}>{score}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', getScoreBgColor(score))} style={{ width: `${score}%` }} />
      </div>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

// Mode Bar
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
        <div className={clsx('h-full rounded-full', isPrimary ? 'bg-[#7877df]' : 'bg-gray-500')} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// Metric explanations
const metricExplanations = {
  decision_quality: 'How well you evaluate AI suggestions before acting',
  output_accuracy: 'Quality of work produced with AI assistance',
  efficiency: 'Time optimization when working with AI',
  appropriateness_of_reliance: 'Relying on AI for appropriate tasks',
  trust_calibration: 'How well your trust matches AI capabilities',
  dialogue_quality: 'Effectiveness of your prompts and interactions',
  cognitive_sustainability: 'Maintaining critical thinking with AI',
  skill_trajectory: 'Whether your skills are growing with AI use',
  expertise_preservation: 'Retaining domain expertise alongside AI',
};

// Mode descriptions
const modeDescriptions: Record<string, string> = {
  approving: 'You select from AI-generated options',
  consulting: 'You seek AI input while making own decisions',
  supervising: 'AI drafts, you refine and improve',
  delegating: 'AI works autonomously on tasks',
};

// Expertise labels
const expertiseLabels: Record<string, { label: string; color: string }> = {
  novice: { label: 'Novice', color: 'bg-gray-500' },
  advanced_beginner: { label: 'Advanced Beginner', color: 'bg-blue-500' },
  competent: { label: 'Competent', color: 'bg-yellow-500' },
  proficient: { label: 'Proficient', color: 'bg-green-500' },
  expert: { label: 'Expert', color: 'bg-purple-500' },
};

// Full Credential Detail View
function CredentialDetailView({ credential }: { credential: Credential }) {
  const primaryMode = credential.mode_primary?.toLowerCase() || 'consulting';
  const estimatedPercentile = credential.percentile || Math.min(99, Math.max(1, Math.round(credential.calibrated_overall_score * 0.9)));

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-gray-700">
      <h2 className="text-2xl font-bold text-white text-center">Your Full Assessment</h2>

      {/* Overall Score with Percentile Bar */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="text-center mb-6">
          <p className={clsx('text-5xl font-bold', getScoreColor(credential.calibrated_overall_score))}>{credential.calibrated_overall_score}</p>
          <p className="text-gray-400 mt-1">Overall Calibrated Score</p>
        </div>

        {/* Percentile Visualization */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Percentile Ranking</span>
            <span className={clsx('text-sm font-semibold', getScoreBenchmark(credential.calibrated_overall_score).color)}>
              {getScoreBenchmark(credential.calibrated_overall_score).label}
            </span>
          </div>
          <div className="relative h-4 bg-gray-600 rounded-full overflow-hidden mb-2">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-blue-500 to-green-500 opacity-30" />
            <div className="absolute h-full bg-[#7877df] rounded-full" style={{ width: `${estimatedPercentile}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[#7877df]"
              style={{ left: `calc(${estimatedPercentile}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="text-[#7877df] font-medium">You scored higher than {estimatedPercentile}% of professionals</span>
            <span>100%</span>
          </div>
        </div>

        {/* Score Interpretation */}
        <div className="mt-4 grid grid-cols-5 gap-1 text-center text-xs">
          <div className={clsx('py-2 rounded', credential.calibrated_overall_score < 50 ? 'bg-red-500/30 text-red-400' : 'bg-gray-700/50 text-gray-500')}>
            <div>0-49</div><div>Emerging</div>
          </div>
          <div className={clsx('py-2 rounded', credential.calibrated_overall_score >= 50 && credential.calibrated_overall_score < 65 ? 'bg-yellow-500/30 text-yellow-400' : 'bg-gray-700/50 text-gray-500')}>
            <div>50-64</div><div>Developing</div>
          </div>
          <div className={clsx('py-2 rounded', credential.calibrated_overall_score >= 65 && credential.calibrated_overall_score < 75 ? 'bg-[#7877df]/30 text-[#7877df]' : 'bg-gray-700/50 text-gray-500')}>
            <div>65-74</div><div>Proficient</div>
          </div>
          <div className={clsx('py-2 rounded', credential.calibrated_overall_score >= 75 && credential.calibrated_overall_score < 85 ? 'bg-blue-500/30 text-blue-400' : 'bg-gray-700/50 text-gray-500')}>
            <div>75-84</div><div>Strong</div>
          </div>
          <div className={clsx('py-2 rounded', credential.calibrated_overall_score >= 85 ? 'bg-green-500/30 text-green-400' : 'bg-gray-700/50 text-gray-500')}>
            <div>85+</div><div>Exceptional</div>
          </div>
        </div>
      </div>

      {/* Three Rs Overview with Weights */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">The Three Rs Framework</h3>
        <p className="text-sm text-gray-400 mb-4">Your overall score is weighted: Results (30%) + Relationship (40%) + Resilience (30%)</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className={clsx('text-3xl font-bold', getScoreColor(credential.results_overall))}>{credential.results_overall}</p>
            <p className="text-sm text-gray-400 mt-1">Results</p>
            <p className={clsx('text-xs font-medium', getScoreBenchmark(credential.results_overall).color)}>{getScoreBenchmark(credential.results_overall).label}</p>
            <p className="text-xs text-gray-500 mt-1">30% weight</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center border-2 border-[#7877df]/30">
            <p className={clsx('text-3xl font-bold', getScoreColor(credential.relationship_overall))}>{credential.relationship_overall}</p>
            <p className="text-sm text-gray-400 mt-1">Relationship</p>
            <p className={clsx('text-xs font-medium', getScoreBenchmark(credential.relationship_overall).color)}>{getScoreBenchmark(credential.relationship_overall).label}</p>
            <p className="text-xs text-[#7877df] mt-1">40% weight (primary)</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className={clsx('text-3xl font-bold', getScoreColor(credential.resilience_overall))}>{credential.resilience_overall}</p>
            <p className="text-sm text-gray-400 mt-1">Resilience</p>
            <p className={clsx('text-xs font-medium', getScoreBenchmark(credential.resilience_overall).color)}>{getScoreBenchmark(credential.resilience_overall).label}</p>
            <p className="text-xs text-gray-500 mt-1">30% weight</p>
          </div>
        </div>
      </div>

      {/* Profile Description */}
      {credential.profile_description && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Your Profile: {credential.profile_type}</h3>
          <p className="text-gray-300">{credential.profile_description}</p>
        </div>
      )}

      {/* Detailed Three Rs Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Results */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-white">Results</h3>
            <span className={clsx('text-2xl font-bold', getScoreColor(credential.results_overall))}>{credential.results_overall}</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">Are you getting better outcomes?</p>
          <p className={clsx('text-xs mb-4', getScoreBenchmark(credential.results_overall).color)}>
            {getScoreBenchmark(credential.results_overall).label} — {getScoreBenchmark(credential.results_overall).description}
          </p>
          <ScoreBar label="Decision Quality" score={credential.results_decision_quality} description={metricExplanations.decision_quality} />
          <ScoreBar label="Output Accuracy" score={credential.results_output_accuracy} description={metricExplanations.output_accuracy} />
          <ScoreBar label="Efficiency" score={credential.results_efficiency} description={metricExplanations.efficiency} />
        </div>

        {/* Relationship */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-white">Relationship</h3>
            <span className={clsx('text-2xl font-bold', getScoreColor(credential.relationship_overall))}>{credential.relationship_overall}</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">Is your collaboration healthy?</p>
          <p className={clsx('text-xs mb-4', getScoreBenchmark(credential.relationship_overall).color)}>
            {getScoreBenchmark(credential.relationship_overall).label} — {getScoreBenchmark(credential.relationship_overall).description}
          </p>
          <ScoreBar label="Reliance Balance" score={credential.relationship_appropriateness_of_reliance} description={metricExplanations.appropriateness_of_reliance} />
          <ScoreBar label="Trust Calibration" score={credential.relationship_trust_calibration} description={metricExplanations.trust_calibration} />
          <ScoreBar label="Dialogue Quality" score={credential.relationship_dialogue_quality} description={metricExplanations.dialogue_quality} />
        </div>

        {/* Resilience */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-white">Resilience</h3>
            <span className={clsx('text-2xl font-bold', getScoreColor(credential.resilience_overall))}>{credential.resilience_overall}</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">Are you staying sharp?</p>
          <p className={clsx('text-xs mb-4', getScoreBenchmark(credential.resilience_overall).color)}>
            {getScoreBenchmark(credential.resilience_overall).label} — {getScoreBenchmark(credential.resilience_overall).description}
          </p>
          <ScoreBar label="Cognitive Sustainability" score={credential.resilience_cognitive_sustainability} description={metricExplanations.cognitive_sustainability} />
          <ScoreBar label="Skill Trajectory" score={credential.resilience_skill_trajectory} description={metricExplanations.skill_trajectory} />
          <ScoreBar label="Expertise Preservation" score={credential.resilience_expertise_preservation} description={metricExplanations.expertise_preservation} />
        </div>
      </div>

      {/* Collaboration Mode */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Collaboration Mode</h3>
        <p className="text-sm text-gray-400 mb-4">{modeDescriptions[primaryMode] || 'How you work with AI'}</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <ModeBar label="Approving" percentage={credential.mode_approving_pct} isPrimary={primaryMode === 'approving'} />
            <ModeBar label="Consulting" percentage={credential.mode_consulting_pct} isPrimary={primaryMode === 'consulting'} />
            <ModeBar label="Supervising" percentage={credential.mode_supervising_pct} isPrimary={primaryMode === 'supervising'} />
            <ModeBar label="Delegating" percentage={credential.mode_delegating_pct} isPrimary={primaryMode === 'delegating'} />
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4 text-xs text-gray-400 space-y-1">
            <p><span className="text-gray-300 font-medium">Approving:</span> Selecting from AI options</p>
            <p><span className="text-gray-300 font-medium">Consulting:</span> AI advises, you decide</p>
            <p><span className="text-gray-300 font-medium">Supervising:</span> AI drafts, you refine</p>
            <p><span className="text-gray-300 font-medium">Delegating:</span> AI works autonomously</p>
          </div>
        </div>
      </div>

      {/* Domain Expertise */}
      {credential.domains && credential.domains.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Domain Expertise</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {credential.domains.map((domain, index) => {
              const expertise = expertiseLabels[domain.domain_expertise] || expertiseLabels.competent;
              return (
                <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-white">{domain.domain_name}</h4>
                    <span className={clsx('text-xs px-2 py-0.5 rounded text-white', expertise.color)}>{expertise.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{domain.domain_pct}% of AI usage</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Results</span><span className={getScoreColor(domain.domain_results)}>{domain.domain_results}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Relationship</span><span className={getScoreColor(domain.domain_relationship)}>{domain.domain_relationship}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Resilience</span><span className={getScoreColor(domain.domain_resilience)}>{domain.domain_resilience}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// Result Section
function ResultSection({
  credentialSummary,
  onReset,
}: {
  credentialSummary: CredentialGenerateResponse['credential'];
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [fullCredential, setFullCredential] = useState<Credential | null>(null);
  const [loadingCredential, setLoadingCredential] = useState(true);

  // Fetch full credential data for PDF generation
  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const data = await getCredential(credentialSummary.id);
        setFullCredential(data);
      } catch (err) {
        console.error('Failed to fetch credential:', err);
      } finally {
        setLoadingCredential(false);
      }
    };
    fetchCredential();
  }, [credentialSummary.id]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(credentialSummary.verification_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Credential Generated!</h1>
        <p className="text-gray-400">
          Your AI Collaboration Credential is ready
        </p>
      </div>

      {/* Credential Card */}
      <div className="bg-gray-800 rounded-xl p-8 space-y-6">
        {/* Rating Badge */}
        <div className="text-center">
          <RatingBadge rating={credentialSummary.qualification_rating} size="lg" />
          <p className="text-gray-400 text-sm mt-3">
            {getRatingDescription(credentialSummary.qualification_rating)}
          </p>
        </div>

        {/* Score */}
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className={clsx('text-5xl font-bold', getScoreColor(credentialSummary.calibrated_score))}>
              {credentialSummary.calibrated_score}
            </p>
            <p className="text-gray-400 text-sm mt-1">Calibrated Score</p>
          </div>
          {credentialSummary.percentile && (
            <div className="text-center">
              <p className="text-5xl font-bold text-[#7877df]">
                {credentialSummary.percentile}%
              </p>
              <p className="text-gray-400 text-sm mt-1">Percentile</p>
            </div>
          )}
        </div>

        {/* Profile Type */}
        <div className="text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Profile Type</p>
          <p className="text-xl font-semibold text-white mt-1">{credentialSummary.profile_type}</p>
        </div>

        {/* Credential ID */}
        <div className="text-center border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-500">Credential ID</p>
          <p className="font-mono text-white">{credentialSummary.credential_id}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* PDF Downloads */}
        <div className="grid grid-cols-2 gap-4">
          {loadingCredential || !fullCredential ? (
            <>
              <button
                disabled
                className="py-3 px-4 bg-gray-700 text-gray-400 rounded-lg font-medium cursor-wait"
              >
                Loading...
              </button>
              <button
                disabled
                className="py-3 px-4 bg-gray-700 text-gray-400 rounded-lg font-medium cursor-wait"
              >
                Loading...
              </button>
            </>
          ) : (
            <>
              <PDFDownloadButton credential={fullCredential} type="full" />
              <PDFDownloadButton credential={fullCredential} type="summary" />
            </>
          )}
        </div>

        {/* Share Link */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Verification Link</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={credentialSummary.verification_url}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm font-mono"
            />
            <button
              onClick={handleCopyLink}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-[#7877df] hover:bg-[#6665c9] text-white'
              )}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Share this link with employers or colleagues to verify your credential
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-[#7877df]/20 border border-[#7877df]/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-[#7877df]">→</span>
            Download your PDF credential and share it
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#7877df]">→</span>
            Add the verification link to your LinkedIn profile
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#7877df]">→</span>
            Include your credential ID in job applications
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#7877df]">→</span>
            Retake the assessment in 3 months to track improvement
          </li>
        </ul>
      </div>

      {/* Full Credential Detail */}
      {fullCredential && <CredentialDetailView credential={fullCredential} />}

      {/* Reset */}
      <div className="text-center pt-4">
        <button
          onClick={onReset}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Generate another credential
        </button>
      </div>
    </div>
  );
}

// Main Page
export default function CredentialPage() {
  const [step, setStep] = useState<'copy' | 'paste' | 'result'>('copy');
  const [credential, setCredential] = useState<CredentialGenerateResponse['credential'] | null>(null);

  const handleCredentialGenerated = (data: CredentialGenerateResponse['credential']) => {
    setCredential(data);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a href="https://corrix.ai" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Corrix" className="h-8" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {step === 'copy' && <CopyPromptSection onCopied={() => setStep('paste')} />}
        {step === 'paste' && (
          <SubmitSection
            onBack={() => setStep('copy')}
            onSubmitted={handleCredentialGenerated}
          />
        )}
        {step === 'result' && credential && (
          <ResultSection
            credentialSummary={credential}
            onReset={() => {
              setCredential(null);
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
          <p className="mt-3">
            <a href="https://corrix.ai/privacy" className="text-gray-500 hover:text-gray-400 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
