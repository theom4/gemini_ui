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
    const stores = storesStr.split(',').map(s => s.trim()).filter(Boolean);
    console.log('📦 [AuthContext] Parsed Stores Array:', stores);
    return stores;
  };

  const fetchProfileAndSet = async (email: string, fallbackId: string) => {
    console.log('🔍 [AuthContext] Initiating Profile Lookup for email:', email);
    try {
      const profileData = await getProfileByEmail(email);
      if (profileData) {
        console.log('✅ [AuthContext] Profile Found in DB:', {
            pulled_id: profileData.id,
            email: profileData.email,
            raw_stores_string: profileData.stores
        });
        
        setProfile({
          id: profileData.id, 
          email: email,
          role: (profileData.role as 'admin' | 'user') ?? 'user',
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          stores: parseStores(profileData.stores),
        });
      } else {
        console.warn('⚠️ [AuthContext] No profile found in public.profiles for email:', email, '. Falling back to Auth ID:', fallbackId);
        setProfile({
          id: fallbackId,
          email: email,
          role: 'user',
          stores: [],
        });
      }
    } catch (error) {
      console.error('❌ [AuthContext] Error in fetchProfileAndSet:', error);
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.email) {
      await fetchProfileAndSet(session.user.email, session.user.id);
    }
  };

  const signOut = async () => {
    console.log('🚪 [AuthContext] Signing out user...');
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  useEffect(() => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 [AuthContext] Auth State Change Event:', event);
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
