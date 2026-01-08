import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  verifyBusinessAccess: () => Promise<{ hasAccess: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      handleSessionChange(session);
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionChange = (session: Session | null) => {
    setSession(session);
    setError(null);

    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || 'مستخدم',
      });
    } else {
      setUser(null);
    }
  };

  const verifyBusinessAccess = async (): Promise<{ hasAccess: boolean; error: string | null }> => {
    try {
      if (!user) {
        return { hasAccess: false, error: 'لم يتم تسجيل الدخول' };
      }

      const { data, error: queryError } = await supabase
        .from('business_members')
        .select('id, business_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (queryError) {
        console.error('Error verifying business access:', queryError);
        return {
          hasAccess: false,
          error: `خطأ في الوصول إلى البيانات: ${queryError.message}`
        };
      }

      if (!data) {
        return {
          hasAccess: false,
          error: 'لم يتم العثور على أي عمل مرتبط بحسابك. سيتم إنشاء عمل جديد تلقائياً.'
        };
      }

      return { hasAccess: true, error: null };
    } catch (err) {
      console.error('Unexpected error in verifyBusinessAccess:', err);
      return {
        hasAccess: false,
        error: err instanceof Error ? err.message : 'خطأ غير متوقع'
      };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const origin = window.location.origin;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    localStorage.removeItem('currentBusinessId');
  };

  const resetPassword = async (email: string) => {
    try {
      const origin = window.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user && !!session,
        isLoading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        verifyBusinessAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
