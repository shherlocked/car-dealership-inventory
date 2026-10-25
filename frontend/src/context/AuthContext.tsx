import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login as apiLogin,
  register as apiRegister,
  setUnauthorizedHandler,
  TOKEN_KEY,
} from '../api/client';
import type { User } from '../types';

const USER_KEY = 'user';

/** Shape exposed to consumers via useAuth(). */
interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Safely reads persisted JSON from localStorage, returning null on any failure. */
function readPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/** Safely reads the persisted token from localStorage, returning null on any failure. */
function readPersistedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Provides authentication state to the app.
 * Persists token and user in localStorage, wrapped in try/catch for safety.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readPersistedToken());
  const [user, setUser] = useState<User | null>(() => readPersistedUser());
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    try {
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    } catch {
      // Persistence is best-effort; the in-memory session still works.
    }
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    // Registration does not create a session; the caller redirects to /login.
    await apiRegister(email, password);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage failures during logout.
    }
    setToken(null);
    setUser(null);
  }, []);

  // Register a global 401 handler so expired sessions clear state and redirect.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access authentication state; must be used within an AuthProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
