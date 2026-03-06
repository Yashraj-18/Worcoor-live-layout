'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthContext } from './AuthContextProviderForApi';

export type AuthData = {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
};

export type AuthContextType = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (authData: AuthData) => void;
  authLogout: () => void;
  user: AuthData | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? '';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<AuthData | null>(null);

  const login = useCallback((authData: AuthData) => {
    setIsAuthenticated(true);
    setUser(authData);
  }, []);

  const authLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        let res: Response;
        try {
          res = await fetch(`${apiBase}/api/auth/me`, {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            const { user: u, organization: org } = data as { 
              user: { id: string; email: string; role: string };
              organization?: { id: string; name: string };
            };
            const userData = {
              id: u.id,
              email: u.email,
              role: u.role,
              organizationId: org?.id,
              organizationName: org?.name,
            };
            console.log(' Session restored for user:', u.email, 'Organization:', org?.name, '(', org?.id, ')');
            setIsAuthenticated(true);
            setUser(userData);
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAuthContext({
      isAuthenticated,
      isAuthLoading,
      login,
      authLogout,
      user,
    });

    return () => setAuthContext(null);
  }, [isAuthenticated, isAuthLoading, login, authLogout, user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        login,
        authLogout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};