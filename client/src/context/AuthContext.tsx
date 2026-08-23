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
  isAuthModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot_password' | 'verify_email';
  openAuthModal: (view?: 'login' | 'register' | 'forgot_password' | 'verify_email') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verify: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  logout: () => void;
  updateProfile: (fields: { avatar?: string; coverPhoto?: string; name?: string; role?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'forgot_password' | 'verify_email'>('login');

  const openAuthModal = useCallback((view: 'login' | 'register' | 'forgot_password' | 'verify_email' = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const fetchProfile = async (userId: string, email: string, emailConfirmedAt?: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
    
    if (data) {
      let isVerified = data.is_verified;
      
      // Auto-sync for older accounts that verified before the sync fix
      if (emailConfirmedAt && !isVerified) {
        isVerified = true;
        supabase.from('profiles').update({ is_verified: true }).eq('id', userId).then(({error}) => {
          if (error) console.warn('Retroactive verify sync failed:', error);
        });
      }

      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        isVerified: isVerified,
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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session retrieval error:', error.message);
        }
        
        if (session?.user) {
          setToken(session.access_token);
          await fetchProfile(session.user.id, session.user.email!, session.user.email_confirmed_at);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Failed to restore Supabase auth session:', err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      try {
        if (session?.user) {
          setToken(session.access_token);
          await fetchProfile(session.user.id, session.user.email!, session.user.email_confirmed_at);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Auth state change profile fetch error:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
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
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup'
    });
    if (error) throw new Error(error.message);

    if (data.user) {
      // Update profile in DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', data.user.id);
        
      if (updateError) {
        console.warn('Failed to sync verified status to profile:', updateError);
      } else {
        // Update local state if this is the current user
        setUser(prev => {
          if (prev && prev.id === data.user?.id) {
            return { ...prev, isVerified: true };
          }
          return prev;
        });
      }
    }
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw new Error(error.message);
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (fields: { avatar?: string; coverPhoto?: string; name?: string; role?: string }) => {
    if (!user) throw new Error('Not authenticated');

    const dbFields: any = {};
    if (fields.avatar !== undefined) dbFields.avatar = fields.avatar;
    if (fields.coverPhoto !== undefined) dbFields.cover_photo = fields.coverPhoto;
    if (fields.name !== undefined) dbFields.name = fields.name;
    if (fields.role !== undefined) dbFields.role = fields.role;

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
        name: data.name,
        role: data.role
      } : null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, 
      isAuthModalOpen, authModalView, openAuthModal, closeAuthModal,
      login, register,      verify,
      resendOtp,
      signInWithOAuth,
      logout,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
