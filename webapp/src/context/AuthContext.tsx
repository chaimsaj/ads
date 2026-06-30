import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi, type RegisterRequest } from '../api/auth';
import { getAccessToken, clearTokens } from '../api/client';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // No token means the user is logged out — skip the profile call.
    if (!getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      // On a 401 the client auto-refreshes; if that fails it clears the tokens.
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout; tokens are cleared regardless.
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <>{children}</>;
}
