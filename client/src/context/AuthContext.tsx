import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isVerified: boolean;
  avatar: string | null;
  coverPhoto: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // Keep for backward compatibility if needed, though Supabase handles sessions
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verify: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fields: { avatar?: string; coverPhoto?: string; name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
    
    if (data) {
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        isVerified: data.is_verified,
        avatar: data.avatar,
        coverPhoto: data.cover_photo
      });
    } else {
      // Fallback if profile not created yet
      setUser({
        id: userId,
        name: email.split('@')[0],
        email: email,
        isVerified: false,
        avatar: null,
        coverPhoto: null
      });
    }
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setToken(session.access_token);
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    restoreSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setToken(session.access_token);
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user'
        }
      }
    });
    
    if (error) throw new Error(error.message);
  }, []);

  const verify = useCallback(async (email: string, otp: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });
    if (error) throw new Error(error.message);
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (fields: { avatar?: string; coverPhoto?: string; name?: string }) => {
    if (!user) throw new Error('Not authenticated');

    const dbFields: any = {};
    if (fields.avatar !== undefined) dbFields.avatar = fields.avatar;
    if (fields.coverPhoto !== undefined) dbFields.cover_photo = fields.coverPhoto;
    if (fields.name !== undefined) dbFields.name = fields.name;

    const { error, data } = await supabase
      .from('profiles')
      .update(dbFields)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    
    if (data) {
      setUser(prev => prev ? {
        ...prev,
        avatar: data.avatar,
        coverPhoto: data.cover_photo,
        name: data.name
      } : null);
    }
  }, [user]);

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
