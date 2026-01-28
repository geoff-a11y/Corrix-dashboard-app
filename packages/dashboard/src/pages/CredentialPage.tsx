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

      {/* Sample Preview */}
      <div className="max-w-2xl mx-auto bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-xl p-6 border border-gray-700">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Sample Credential Preview</p>
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-2xl font-bold text-white">72</p>
            <p className="text-xs text-gray-500">Calibrated Score</p>
          </div>
          <div className="px-4 py-2 bg-blue-600 rounded-lg text-white font-semibold text-sm">
            Qualified
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-300">Technical Collaborator</p>
            <p className="text-xs text-gray-500">Profile Type</p>
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

  useEffect(() => {
    async function loadPDFComponents() {
      try {
        const pdfRenderer = await import('@react-pdf/renderer');
        setPDFLink(() => pdfRenderer.PDFDownloadLink);

        if (type === 'full') {
          const mod = await import('@/components/pdf/FullReportPDF');
          setPDFComponent(() => mod.FullReportPDF);
        } else {
          const mod = await import('@/components/pdf/SummaryPDF');
          setPDFComponent(() => mod.SummaryPDF);
        }
      } catch (error) {
        console.error('Failed to load PDF components:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPDFComponents();
  }, [type]);

  const fileName = type === 'full'
    ? `Corrix-Credential-${credential.credential_id}.pdf`
    : `Corrix-Summary-${credential.credential_id}.pdf`;

  if (loading || !PDFComponent || !PDFLink) {
    return (
      <button
        disabled
        className="py-3 px-4 bg-gray-700 text-gray-400 rounded-lg font-medium cursor-wait text-center block w-full"
      >
        Loading PDF...
      </button>
    );
  }

  const PDFDownloadLink = PDFLink;
  const DocumentComponent = PDFComponent;

  return (
    <PDFDownloadLink
      document={<DocumentComponent credential={credential} />}
      fileName={fileName}
      className="py-3 px-4 bg-[#7877df] hover:bg-[#6665c9] text-white rounded-lg font-medium transition-colors text-center block"
    >
      {({ loading: pdfLoading }: { loading: boolean }) =>
        pdfLoading
          ? 'Preparing PDF...'
          : type === 'full'
            ? 'Download Full Report'
            : 'Download Summary'
      }
    </PDFDownloadLink>
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
        </div>
      </footer>
    </div>
  );
}
