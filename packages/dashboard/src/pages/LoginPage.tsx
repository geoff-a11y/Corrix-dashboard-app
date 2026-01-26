import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

type LoginMode = 'magic-link' | 'password';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<LoginMode>('magic-link');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const { login, requestMagicLink, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/home';

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await requestMagicLink(email);
      setMagicLinkSent(true);
      if (result.devLink) {
        setDevLink(result.devLink);
      }
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-bg-tertiary flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-bg-primary/50 backdrop-blur rounded-card shadow-card p-6 border border-border-subtle">
            <div className="flex flex-col items-center justify-center mb-6">
              <img
                src="/images/logo.png"
                alt="Corrix"
                className="h-10 w-auto"
              />
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Check your email</h2>
              <p className="text-sm text-text-secondary mb-4">
                We sent a login link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-text-muted">
                Click the link in the email to sign in. The link expires in 15 minutes.
              </p>

              {devLink && (
                <div className="mt-4 p-3 bg-bg-tertiary rounded-lg border border-border-default">
                  <p className="text-xs text-text-muted mb-2">Dev mode - click to login:</p>
                  <a
                    href={devLink}
                    className="text-xs text-accent hover:underline break-all"
                  >
                    Open magic link
                  </a>
                </div>
              )}

              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setDevLink(null);
                }}
                className="mt-6 text-sm text-accent hover:underline"
              >
                Use a different email
              </button>
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
          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img
              src="/images/logo.png"
              alt="Corrix"
              className="h-10 w-auto"
            />
            <p className="text-xs text-text-muted mt-2">Admin Dashboard</p>
          </div>

          {mode === 'magic-link' ? (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="label block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-score-low/10 border border-score-low/30">
                  <p className="text-sm text-score-low">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send login link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className="text-xs text-text-muted hover:text-text-secondary"
                >
                  Admin? Sign in with password
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="label block mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder="admin@example.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="label block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full"
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-score-low/10 border border-score-low/30">
                  <p className="text-sm text-score-low">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full py-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('magic-link')}
                  className="text-xs text-text-muted hover:text-text-secondary"
                >
                  Use magic link instead
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
