import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyMagicLink, isAuthenticated, error } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setIsVerifying(false);
      return;
    }

    verifyMagicLink(token)
      .then(() => {
        navigate('/home', { replace: true });
      })
      .catch(() => {
        setIsVerifying(false);
      });
  }, [searchParams, verifyMagicLink, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-bg-tertiary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-bg-primary/50 backdrop-blur rounded-card shadow-card p-6 border border-border-subtle">
            <div className="flex flex-col items-center justify-center">
              <img
                src="/images/logo.png"
                alt="Corrix"
                className="h-10 w-auto mb-6"
              />
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-secondary">Verifying your login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-tertiary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-bg-primary/50 backdrop-blur rounded-card shadow-card p-6 border border-border-subtle">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Corrix"
              className="h-10 w-auto mb-6"
            />

            <div className="w-16 h-16 bg-score-low/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-score-low" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {error || 'Invalid or expired link'}
            </h2>
            <p className="text-sm text-text-secondary mb-6 text-center">
              This login link is no longer valid. Please request a new one.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary px-6 py-2"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
