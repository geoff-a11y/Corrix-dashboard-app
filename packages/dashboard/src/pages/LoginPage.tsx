import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/overview';

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-bg-tertiary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            <img
              src="/images/logo.png"
              alt="Corrix"
              className="h-10 w-auto"
            />
            <p className="text-xs text-text-muted mt-2">Admin Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            Demo: admin@demo.corrix.ai / demo123
          </p>
        </div>
      </div>
    </div>
  );
}
