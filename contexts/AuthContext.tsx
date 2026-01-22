import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getProfile } from '../services/api';

export interface UserProfile {
  id: string;
  role: 'admin' | 'user';
  full_name?: string | null;
  avatar_url?: string | null;
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

    // 1. Get initial session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      
      if (session?.user) {
        // Fetch profile
        getProfile(session.user.id).then(profileData => {
            if (!mounted) return;
            if (profileData) {
                setProfile({
                  id: session.user.id,
                  role: (profileData.role as 'admin' | 'user') ?? 'user',
                  full_name: (profileData.full_name as string | null) ?? null,
                  avatar_url: (profileData.avatar_url as string | null) ?? null,
                });
            } else {
                setProfile({ id: session.user.id, role: 'user' });
            }
            setLoading(false);
        }).catch(() => {
             if (mounted) {
                 setProfile({ id: session.user.id, role: 'user' });
                 setLoading(false);
             }
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setSession(session);
      
      if (session?.user) {
         if (event === 'SIGNED_IN') {
             // Refresh profile on explicit sign in
             try {
                const profileData = await getProfile(session.user.id);
                if (mounted) {
                    if (profileData) {
                        setProfile({
                            id: session.user.id,
                            role: (profileData.role as 'admin' | 'user') ?? 'user',
                            full_name: (profileData.full_name as string | null) ?? null,
                            avatar_url: (profileData.avatar_url as string | null) ?? null,
                        });
                    } else {
                        setProfile({ id: session.user.id, role: 'user' });
                    }
                }
             } catch(e) {
                 if (mounted) setProfile({ id: session.user.id, role: 'user' });
             }
         }
         // If we just got a session update but no profile, ensure loading is cleared
         setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Real-time profile updates
  useEffect(() => {
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    if (session?.user) {
      profileChannel = supabase
        .channel(`profile:${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${session.user.id}`,
          },
          async (payload) => {
            const newData = payload.new as any;
            const freshProfile: UserProfile = {
              id: session.user.id,
              role: (newData.role as 'admin' | 'user') ?? 'user',
              full_name: (newData.full_name as string | null) ?? null,
              avatar_url: (newData.avatar_url as string | null) ?? null,
            };
            setProfile(freshProfile);
          }
        )
        .subscribe();
    }

    return () => {
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [session?.user?.id]);

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