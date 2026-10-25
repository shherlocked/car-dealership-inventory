import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import BrandPanel from '../components/BrandPanel';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

/**
 * Login page. Split layout with a brand panel on large screens and a form on
 * the right. Client-side validation, password visibility toggle, loading
 * state and server error rendering. Authenticated users redirect to the
 * dashboard, and a successful login replaces /login in history.
 */
export default function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFieldErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });

    if (emailError || passwordError) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-white">Log in</h1>
          <p className="mt-2 text-sm text-slate-400">Welcome back to the dealership inventory.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-danger">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-danger">{fieldErrors.password}</p>
              )}
            </div>

            {serverError && (
              <p className="rounded-lg border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Spinner />}
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent-400 hover:text-accent-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
