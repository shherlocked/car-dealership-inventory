import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

/**
 * Top navigation bar: sticky with a translucent blur. Shows the brand mark and
 * wordmark plus either the logged-in user's email, role badge and logout, or
 * login/register links. A toggle reveals the same actions in a mobile menu.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Showroom home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <LoggedInActions user={user} onLogout={logout} />
          ) : (
            <LoggedOutActions />
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle menu"
          className="rounded-lg border border-line bg-surface p-2 text-slate-300 transition-colors hover:text-white md:hidden"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-nav"
          className="border-t border-line bg-surface px-4 py-4 md:hidden"
        >
          {user ? (
            <div className="space-y-4">
              <LoggedInActions user={user} onLogout={logout} column />
            </div>
          ) : (
            <LoggedOutActions column />
          )}
        </div>
      )}
    </header>
  );
}

interface LoggedInActionsProps {
  user: { email: string; role: 'USER' | 'ADMIN' };
  onLogout: () => void;
  column?: boolean;
}

function LoggedInActions({ user, onLogout, column = false }: LoggedInActionsProps) {
  return (
    <div className={`${column ? 'flex-col' : 'flex-row'} flex items-${column ? 'stretch' : 'center'} gap-4`}>
      <div className={`flex ${column ? 'flex-col' : 'flex-row'} items-${column ? 'stretch' : 'center'} gap-3`}>
        <span className="text-sm text-slate-300">{user.email}</span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            user.role === 'ADMIN'
              ? 'border-accent-500/30 bg-accent-500/15 text-accent-300'
              : 'border-line bg-surface-200 text-slate-300'
          }`}
        >
          {user.role === 'ADMIN' ? 'Admin' : 'User'}
        </span>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-danger/50 hover:text-danger"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}

function LoggedOutActions({ column = false }: { column?: boolean }) {
  return (
    <div className={`flex ${column ? 'flex-col' : 'flex-row'} items-${column ? 'stretch' : 'center'} gap-3`}>
      <Link
        to="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="rounded-lg bg-gradient-accent px-4 py-2 text-sm font-medium text-white shadow-glow transition-transform hover:scale-[1.02]"
      >
        Register
      </Link>
    </div>
  );
}
