'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import localStorageService from '@/src/services/localStorageService';
import { apiService } from '@/src/services/apiService';
import { api_url } from '@/src/constants/api_url';
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

type JwtPayload = { exp: number; sub: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userData, setUserData] = useState<AuthData['userData'] | null>(null);

  const refreshTimer = useRef<NodeJS.Timeout | null>(null);
  const retryInterval = useRef<NodeJS.Timeout | null>(null);

  const scheduleTokenRefresh = (accessToken: string, refreshToken: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);

    try {
      const decoded: JwtPayload = jwtDecode(accessToken);
      const expiryMs = decoded.exp * 1000;
      const refreshTime = expiryMs - Date.now() - 2 * 60 * 1000;

      if (refreshTime > 0) {
        refreshTimer.current = setTimeout(() => {
          refreshAccessToken(refreshToken);
        }, refreshTime);
      }
    } catch (err) {
      console.error('Failed to decode token for refresh schedule:', err);
    }
  };

  const refreshAccessToken = async (refreshToken: string) => {
    // ✅ Mock token refresh - no external API call
    console.log('Mock: Token refresh skipped (using mock authentication)');
    
    const authData = localStorageService.getItem<AuthData>('authData');
    if (!authData?._id) return;
    const newAccessToken = authData.accessToken;
    const storedAuth = localStorageService.getItem<AuthData>('authData');
    if (storedAuth) {
      const updatedAuth = { ...storedAuth, accessToken: newAccessToken };
      localStorageService.setItem('authData', updatedAuth);
      setUserData(updatedAuth.userData);
      setIsAuthenticated(true);
      apiService.setAuthToken(newAccessToken);
      scheduleTokenRefresh(newAccessToken, storedAuth.refreshToken);
    }
    if (retryInterval.current) {
      clearInterval(retryInterval.current);
      retryInterval.current = null;
    }
  };

  const startRetry = (refreshToken: string) => {
    if (retryInterval.current) return;

    retryInterval.current = setInterval(() => {
      console.log('Retrying token refresh...');
      refreshAccessToken(refreshToken);
    }, 30 * 1000);
  };

  const login = (authData: AuthData) => {
    localStorageService.setItem('authData', authData);
    setIsAuthenticated(true);
    setIsAuthLoading(false);
    setUserData(authData.userData); // ✅ keep userData in context
    scheduleTokenRefresh(authData.accessToken, authData.refreshToken);
  };

  const authLogout = () => {
    localStorageService.removeItem('authData');
    setIsAuthenticated(false);
    setIsAuthLoading(false);
    setUserData(null);
    apiService.clearAuthToken();

    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    if (retryInterval.current) {
      clearInterval(retryInterval.current);
      retryInterval.current = null;
    }
  };

  const checkAndRefreshIfNearExpiry = (accessToken: string, refreshToken: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(accessToken);
      const expiryMs = decoded.exp * 1000;
      const timeLeft = expiryMs - Date.now();

      if (timeLeft < 2 * 60 * 1000) {
        console.log('Token near expiry, refreshing immediately...');
        refreshAccessToken(refreshToken);
      }
    } catch (err) {
      console.error('Error checking token expiry:', err);
    }
  };

  // ✅ run only once on mount
  useEffect(() => {
    const authData = localStorageService.getItem<AuthData>('authData');
    if (authData?.isLogin) {
      setIsAuthenticated(true);
      setUserData(authData.userData);
      scheduleTokenRefresh(authData.accessToken, authData.refreshToken);
      checkAndRefreshIfNearExpiry(authData.accessToken, authData.refreshToken);
    }
    setIsAuthLoading(false);

    setAuthContext({
      isAuthenticated: !!authData?.isLogin,
      isAuthLoading: false,
      login,
      authLogout,
      userData: authData?.userData || null,
    });

    return () => setAuthContext(null);
  }, []); // 👈 no dependency array to avoid loops

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
