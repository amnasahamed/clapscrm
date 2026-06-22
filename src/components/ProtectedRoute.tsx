import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import AccessDenied from './AccessDenied';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: UserRole;
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, requireRole: checkRole, currentUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    // Redirect to login but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && !checkRole(requireRole)) {
    return <AccessDenied requiredRole={requireRole} />;
  }

  return <>{children}</>;
}
