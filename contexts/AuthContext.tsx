import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getProfile } from '../services/api';

export interface UserProfile {
  id: string;
  role: 'admin' | 'user';
  full_name?: string | null;
  avatar_url?: string | null;
  stores: string[]; // Dynamically parsed from DB
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

  const refreshProfile = async () => {
    if (!session?.user) return;

    try {
      const profileData = await getProfile(session.user.id);
      if (profileData) {
        const freshProfile: UserProfile = {
          id: session.user.id,
          role: (profileData.role as 'admin' | 'user') ?? 'user',
          full_name: (profileData.full_name as string | null) ?? null,
          avatar_url: (profileData.avatar_url as string | null) ?? null,
          stores: parseStores(profileData.stores as string | null),
        };
        setProfile(freshProfile);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const signOut = async () => {
      try {
          await supabase.auth.signOut();
      } catch (error) {
          console.error("Error signing out:", error);
      } finally {
          setSession(null);
          setProfile(null);
          localStorage.clear();
      }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
        }

        if (session?.user) {
           try {
               const profileData = await getProfile(session.user.id);
               if (mounted) {
                 if (profileData) {
                   setProfile({
                       id: session.user.id,
                       role: (profileData.role as 'admin' | 'user') ?? 'user',
                       full_name: (profileData.full_name as string | null) ?? null,
                       avatar_url: (profileData.avatar_url as string | null) ?? null,
                       stores: parseStores(profileData.stores as string | null),
                   });
                 } else {
                   setProfile({ id: session.user.id, role: 'user', stores: [] });
                 }
               }
           } catch (profileError) {
               console.warn("Profile fetch failed", profileError);
               if (mounted) setProfile({ id: session.user.id, role: 'user', stores: [] });
           }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (event === 'SIGNED_OUT') {
             setProfile(null);
             setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
             if (newSession?.user && !profile) {
                const profileData = await getProfile(newSession.user.id);
                if (mounted && profileData) {
                    setProfile({
                        id: newSession.user.id,
                        role: (profileData.role as 'admin' | 'user') ?? 'user',
                        full_name: (profileData.full_name as string | null) ?? null,
                        avatar_url: (profileData.avatar_url as string | null) ?? null,
                        stores: parseStores(profileData.stores as string | null),
                    });
                }
             }
             setLoading(false);
        }
    });

    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            setLoading(false);
        }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
      {!loading ? children : (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0b14] text-white">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-light text-gray-400 animate-pulse">Se încarcă sesiunea...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};