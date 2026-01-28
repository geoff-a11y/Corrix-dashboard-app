import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { verifyCredential } from '@/api/credential';
import type { CredentialVerifyResponse, QualificationRating } from '@/types/credential';
import { getRatingColor, getRatingLabel, getRatingDescription } from '@/types/credential';

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
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

// Loading State
function LoadingState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 border-4 border-[#7877df] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-gray-400 mt-4">Verifying credential...</p>
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
        href="/credential"
        className="inline-block mt-4 bg-[#7877df] hover:bg-[#6665c9] text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Get Your Credential
      </a>
    </div>
  );
}

// Invalid/Expired State
function InvalidState({ credential }: { credential: CredentialVerifyResponse }) {
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
        href="/credential"
        className="inline-block mt-4 bg-[#7877df] hover:bg-[#6665c9] text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Get a New Credential
      </a>
    </div>
  );
}

// Valid Credential Display
function ValidCredential({ credential }: { credential: CredentialVerifyResponse }) {
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

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
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

      {/* Credential Card */}
      <div className="bg-gray-800 rounded-xl p-8 space-y-6">
        {/* Holder Name */}
        {credential.holder_name && (
          <div className="text-center border-b border-gray-700 pb-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Credential Holder</p>
            <p className="text-2xl font-bold text-white mt-1">{credential.holder_name}</p>
          </div>
        )}

        {/* Rating */}
        <div className="text-center">
          <RatingBadge rating={credential.qualification_rating} size="lg" />
          <p className="text-gray-400 text-sm mt-3">
            {getRatingDescription(credential.qualification_rating)}
          </p>
        </div>

        {/* Overall Score */}
        <div className="text-center">
          <p className={clsx('text-5xl font-bold', getScoreColor(credential.overall_score))}>
            {credential.overall_score}
          </p>
          <p className="text-gray-400 text-sm mt-1">Overall Score</p>
        </div>

        {/* Three Rs Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className={clsx('text-2xl font-bold', getScoreColor(credential.scores.results))}>
              {credential.scores.results}
            </p>
            <p className="text-sm text-gray-400">Results</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className={clsx('text-2xl font-bold', getScoreColor(credential.scores.relationship))}>
              {credential.scores.relationship}
            </p>
            <p className="text-sm text-gray-400">Relationship</p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <p className={clsx('text-2xl font-bold', getScoreColor(credential.scores.resilience))}>
              {credential.scores.resilience}
            </p>
            <p className="text-sm text-gray-400">Resilience</p>
          </div>
        </div>

        {/* Profile Type */}
        <div className="text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Profile Type</p>
          <p className="text-lg font-semibold text-white mt-1">{credential.profile_type}</p>
        </div>

        {/* Credential Details */}
        <div className="border-t border-gray-700 pt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Credential ID</p>
            <p className="font-mono text-white">{credential.credential_id}</p>
          </div>
          <div>
            <p className="text-gray-500">Issued</p>
            <p className="text-white">{issuedDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Valid Until</p>
            <p className="text-white">{expiresDate}</p>
          </div>
        </div>
      </div>

      {/* About Corrix */}
      <div className="bg-gray-800/50 rounded-xl p-6 text-center">
        <h3 className="font-semibold text-white mb-2">About Corrix Credentials</h3>
        <p className="text-gray-400 text-sm">
          Corrix credentials validate AI collaboration skills using the Three Rs methodology:
          Results, Relationship, and Resilience. Each credential is generated from an analysis
          of the holder's actual AI usage patterns.
        </p>
        <a
          href="/credential"
          className="inline-block mt-4 text-[#7877df] hover:underline text-sm"
        >
          Get your own credential →
        </a>
      </div>
    </div>
  );
}

// Main Page
export default function CredentialVerifyPage() {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<CredentialVerifyResponse | null>(null);

  useEffect(() => {
    if (!credentialId) {
      setError('No credential ID provided');
      setLoading(false);
      return;
    }

    const fetchCredential = async () => {
      try {
        const data = await verifyCredential(credentialId);
        setCredential(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify credential');
      } finally {
        setLoading(false);
      }
    };

    fetchCredential();
  }, [credentialId]);

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
            <span className="text-gray-500 ml-2">/ Credential Verification</span>
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {loading && <LoadingState />}
        {error && <ErrorState error={error} />}
        {credential && !credential.valid && <InvalidState credential={credential} />}
        {credential && credential.valid && <ValidCredential credential={credential} />}
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
