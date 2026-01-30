import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getProfile } from '../services/api';

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
    if (!storesStr) {
        console.log('🏪 [AuthContext] No stores string found in profile.');
        return [];
    }
    const stores = storesStr.split(',').map(s => s.trim()).filter(Boolean);
    console.log('🏪 [AuthContext] Successfully parsed stores array:', stores);
    return stores;
  };

  const fetchProfileAndSet = async (authUserId: string, email: string) => {
    console.log(`🛰️ [AuthContext] Attempting to pull profile from public.profiles for ID: ${authUserId}`);
    try {
      const profileData = await getProfile(authUserId);
      if (profileData) {
        console.log('📦 [AuthContext] Profile data successfully pulled:', profileData);
        
        const userStores = parseStores(profileData.stores);
        
        setProfile({
          id: profileData.id, 
          email: email,
          role: (profileData.role as 'admin' | 'user') ?? 'user',
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          stores: userStores,
        });
      } else {
        console.warn('⚠️ [AuthContext] Profile row not found in public.profiles for ID:', authUserId);
        setProfile({
          id: authUserId,
          email: email,
          role: 'user',
          stores: [],
        });
      }
    } catch (error) {
      console.error('❌ [AuthContext] Critical error during profile fetch:', error);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfileAndSet(session.user.id, session.user.email || '');
    }
  };

  const signOut = async () => {
    console.log('🚪 [AuthContext] STARTING logout sequence...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('⚠️ [AuthContext] Supabase signOut warning:', error.message);
      }
    } catch (err) {
      console.error('❌ [AuthContext] Error during Supabase signOut:', err);
    } finally {
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      
      console.log('🔑 [AuthContext] Initial session check:', currentSession ? `User: ${currentSession.user.email}` : 'No session');
      setSession(currentSession);
      
      if (currentSession?.user) {
        await fetchProfileAndSet(currentSession.user.id, currentSession.user.email || '');
      }
      
      setLoading(false);
    });

    // Auth Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('🔔 [AuthContext] Auth state change detected:', event);
      setSession(newSession);

      try {
        if (newSession?.user) {
          console.log(`👤 [AuthContext] User Session Active: ${newSession.user.email}`);
          await fetchProfileAndSet(newSession.user.id, newSession.user.email || '');
        } else {
          console.log('👤 [AuthContext] User Session Cleared.');
          setProfile(null);
        }
      } catch (err) {
        console.error('❌ [AuthContext] Error processing auth state change:', err);
      } finally {
        // Crucial: Always stop loading even if profile fetch fails
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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