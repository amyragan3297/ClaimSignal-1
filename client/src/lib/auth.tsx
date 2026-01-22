import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  authenticated: boolean;
  userType: 'team' | 'individual' | null;
  userId?: string;
  email?: string;
  subscriptionStatus?: string;
  needsSubscription?: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (userType: 'team' | 'individual', data: any) => Promise<{ success: boolean; error?: string; needsSubscription?: boolean }>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsSubscription?: boolean }>;
  setupTeam: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    userType: null,
    loading: true,
  });

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      
      if (data.authenticated) {
        setState({
          authenticated: true,
          userType: data.userType,
          userId: data.userId,
          email: data.email,
          subscriptionStatus: data.subscriptionStatus,
          needsSubscription: data.needsSubscription,
          loading: false,
        });
      } else {
        setState({
          authenticated: false,
          userType: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setState({
        authenticated: false,
        userType: null,
        loading: false,
      });
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (userType: 'team' | 'individual', data: { username?: string; email?: string; password: string }) => {
    try {
      const endpoint = userType === 'team' ? '/api/auth/team/login' : '/api/auth/login';
      const body = userType === 'team' 
        ? { username: data.username, password: data.password }
        : { email: data.email, password: data.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        await refreshSession();
        return { success: true, needsSubscription: result.needsSubscription };
      }

      return { success: false, error: result.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        await refreshSession();
        return { success: true, needsSubscription: result.needsSubscription };
      }

      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  };

  const setupTeam = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/team/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        await refreshSession();
        return { success: true };
      }

      return { success: false, error: result.error || 'Setup failed' };
    } catch (error) {
      return { success: false, error: 'Setup failed' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setState({
        authenticated: false,
        userType: null,
        loading: false,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register, setupTeam, refreshSession }}>
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
