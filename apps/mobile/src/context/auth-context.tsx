import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiClient, setUnauthorizedHandler } from '@/lib/api-client';
import { getSession, saveSession, clearSession } from '@/lib/auth-storage';
import type { Session } from '@/types';

interface LoginResponse {
  token: string;
  expiresIn: number;
  employeeId: number;
  fullName: string;
  role: string;
  companyId: number | null;
  contractorId: number | null;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  login: (loginIdentifier: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });
    setUnauthorizedHandler(() => setSession(null));
  }, []);

  const login = useCallback(async (loginIdentifier: string, pin: string) => {
    const { data } = await apiClient.post<LoginResponse>('/api/auth/login-pin', { loginIdentifier, pin });
    const next: Session = {
      token: data.token,
      employeeId: data.employeeId,
      fullName: data.fullName,
      role: data.role,
      companyId: data.companyId,
      contractorId: data.contractorId,
    };
    await saveSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
