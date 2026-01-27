'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import localStorageService from '@/src/services/localStorageService';
import { apiService } from '@/src/services/apiService';
import { setAuthContext } from './AuthContextProviderForApi';

export type AuthData = {
  accessToken: string;
  refreshToken: string;
  _id: string;
  userData: {
    fullName: string;
    maskEmail: string;
    maskContactNo: string;
  };
  isLogin: boolean;
};

export type AuthContextType = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (authData: AuthData) => void;
  authLogout: () => void;
  userData: AuthData['userData'] | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userData, setUserData] = useState<AuthData['userData'] | null>(null);

  const login = (authData: AuthData) => {
    // ✅ Use sessionStorage instead of localStorage
    // This clears when browser closes, but persists during session
    sessionStorage.setItem('authData', JSON.stringify(authData));
    
    setIsAuthenticated(true);
    setIsAuthLoading(false);
    setUserData(authData.userData);
    apiService.setAuthToken(authData.accessToken);
  };

  const authLogout = () => {
    // ✅ Clear both sessionStorage and localStorage
    sessionStorage.removeItem('authData');
    localStorageService.removeItem('authData');
    
    setIsAuthenticated(false);
    setIsAuthLoading(false);
    setUserData(null);
    apiService.clearAuthToken();
  };

  // ✅ Check sessionStorage on mount (stays logged in during browser session)
  // ❌ Does NOT check localStorage (no persistent sessions across browser restarts)
  useEffect(() => {
    const sessionAuthData = sessionStorage.getItem('authData');
    
    if (sessionAuthData) {
      try {
        const authData: AuthData = JSON.parse(sessionAuthData);
        
        if (authData?.isLogin) {
          // Restore session from sessionStorage
          setIsAuthenticated(true);
          setUserData(authData.userData);
          apiService.setAuthToken(authData.accessToken);
          console.log('✅ Session restored from sessionStorage');
        }
      } catch (error) {
        console.error('Failed to parse session auth data:', error);
        sessionStorage.removeItem('authData');
      }
    }
    
    setIsAuthLoading(false);

    setAuthContext({
      isAuthenticated: !!sessionAuthData,
      isAuthLoading: false,
      login,
      authLogout,
      userData: sessionAuthData ? JSON.parse(sessionAuthData).userData : null,
    });

    return () => setAuthContext(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        login,
        authLogout,
        userData,
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