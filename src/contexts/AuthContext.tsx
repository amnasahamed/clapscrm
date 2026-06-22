import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { StaffMember, UserRole, Permission, ROLE_PERMISSIONS, ROLE_HIERARCHY } from '../types';

interface AuthContextType {
  currentUser: StaffMember | null;
  isAuthenticated: boolean;
  login: (staff: StaffMember) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  requireRole: (minimumRole: UserRole) => boolean;
}

const AUTH_STORAGE_KEY = 'edumanage_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StaffMember;
        if (parsed && parsed.name && parsed.role) return parsed;
      }
    } catch { /* ignore corrupt data */ }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  const login = useCallback((staff: StaffMember) => {
    setCurrentUser(staff);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentUser) return false;
    return ROLE_PERMISSIONS[currentUser.role].includes(permission);
  }, [currentUser]);

  const requireRole = useCallback((minimumRole: UserRole): boolean => {
    if (!currentUser) return false;
    return ROLE_HIERARCHY[currentUser.role] >= ROLE_HIERARCHY[minimumRole];
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: currentUser !== null,
      login,
      logout,
      hasPermission,
      requireRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
