import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Top navigation bar. Shows the app name, and either the logged-in user's
 * email with a logout button or login/register links. Responsive by default.
 */
export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Car Dealership
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.role === 'ADMIN'
                  ? 'bg-accent-100 text-accent-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {user.role === 'ADMIN' ? 'Admin' : 'User'}
            </span>
            <button
              onClick={logout}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
            >
              Register
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
