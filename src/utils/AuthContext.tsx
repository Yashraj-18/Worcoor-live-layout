'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { setAuthContext } from './AuthContextProviderForApi';

export type AuthData = {
  id: string;
  email: string;
  role: string;
};

export type AuthContextType = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (authData: AuthData) => void;
  authLogout: () => void;
  user: AuthData | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [user, setUser] = useState<AuthData | null>(null);

  const login = (authData: AuthData) => {
    setIsAuthenticated(true);
    setUser(authData);
  };

  const authLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

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