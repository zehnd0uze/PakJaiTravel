import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  avatar: string | null;
  coverPhoto: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verify: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fields: { avatar?: string; coverPhoto?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pakjai_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const stored = localStorage.getItem('pakjai_token');
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(stored);
        } else {
          localStorage.removeItem('pakjai_token');
          setToken(null);
        }
      } catch {
        localStorage.removeItem('pakjai_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('pakjai_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    // Log them in immediately (Soft Verification)
    localStorage.setItem('pakjai_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const verify = useCallback(async (email: string, otp: string) => {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');

    localStorage.setItem('pakjai_token', data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend code');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pakjai_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (fields: { avatar?: string; coverPhoto?: string }) => {
    const stored = localStorage.getItem('pakjai_token');
    if (!stored) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${stored}`,
      },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verify, resendOtp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
