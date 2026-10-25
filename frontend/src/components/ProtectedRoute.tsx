import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

/**
 * Guards a route so only authenticated (and optionally admin) users can view it.
 * Redirects to /login when unauthenticated and to / when not an admin.
 */
export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { token, isAdmin } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
