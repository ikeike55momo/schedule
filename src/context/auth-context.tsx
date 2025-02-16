import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string | null;
}

interface AuthContextProps {
  session: Session | null;
  user: AuthUser | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const transformUser = (user: User | null): AuthUser | null => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || null,
    };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(transformUser(session?.user || null));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(transformUser(session?.user || null));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            scope: 'https://www.googleapis.com/auth/calendar'
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Google Sign-In error:", error);
      toast.error('Googleログインに失敗しました');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      toast.success('ログアウトしました');
    } catch (error) {
      console.error("Sign-Out error:", error);
      toast.error('ログアウトに失敗しました');
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
