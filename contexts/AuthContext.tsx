import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getProfileByEmail } from '../services/api';

export interface UserProfile {
  id: string; 
  role: 'admin' | 'user';
  full_name?: string | null;
  avatar_url?: string | null;
  stores: string[];
  email: string;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const parseStores = (storesStr: string | null): string[] => {
    if (!storesStr) return [];
    return storesStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const fetchProfileAndSet = async (email: string, fallbackId: string) => {
    try {
      const profileData = await getProfileByEmail(email);
      if (profileData) {
        setProfile({
          id: profileData.id, 
          email: email,
          role: (profileData.role as 'admin' | 'user') ?? 'user',
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          stores: parseStores(profileData.stores),
        });
      } else {
        // Fallback if no profile row exists, use Auth ID
        setProfile({
          id: fallbackId,
          email: email,
          role: 'user',
          stores: [],
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.email) {
      await fetchProfileAndSet(session.user.email, session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
    // 1. Get current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        fetchProfileAndSet(currentSession.user.email, currentSession.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.email) {
        await fetchProfileAndSet(newSession.user.email, newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
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
