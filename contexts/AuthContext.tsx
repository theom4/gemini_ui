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

function useProfileFallback(
  session: Session | null,
  profile: UserProfile | null,
  setProfile: (p: UserProfile) => void,
  loading: boolean
) {
  useEffect(() => {
    if (!session || profile || loading) return;
    const t = setTimeout(() => {
      if (session && !profile) {
        setProfile({ id: session.user.id, role: 'user' });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [session, profile, loading]);
}

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useProfileFallback(session, profile, (p) => setProfile(p), loading);

  const refreshProfile = async () => {
    if (!session?.user) return;

    const cacheKey = `profile:${session.user.id}`;
    try {
      localStorage.removeItem(cacheKey);
    } catch {}

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
        try {
          localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
        } catch {}
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
      }
  };

  useEffect(() => {
    let isMounted = true;
    const watchdog = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          const cacheKey = `profile:${session.user.id}`;

          try {
            const profileData = await getProfile(session.user.id);
            if (!isMounted) return;

            if (profileData) {
              const freshProfile: UserProfile = {
                id: session.user.id,
                role: (profileData.role as 'admin' | 'user') ?? 'user',
                full_name: (profileData.full_name as string | null) ?? null,
                avatar_url: (profileData.avatar_url as string | null) ?? null,
              };

              setProfile(freshProfile);

              try {
                localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
              } catch {}
            } else {
              setProfile({ id: session.user.id, role: 'user' });
            }
          } catch (error) {
            console.error('Failed to fetch profile:', error);
            try {
              const cached = localStorage.getItem(cacheKey);
              if (cached && isMounted) {
                const parsed = JSON.parse(cached) as UserProfile;
                setProfile(parsed);
              } else if (isMounted) {
                setProfile({ id: session.user.id, role: 'user' });
              }
            } catch {
              if (isMounted) setProfile({ id: session.user.id, role: 'user' });
            }
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        const cacheKey = `profile:${session.user.id}`;
        try {
          const profileData = await getProfile(session.user.id);
          if (!isMounted) return;
          if (profileData) {
             const freshProfile: UserProfile = {
              id: session.user.id,
              role: (profileData.role as 'admin' | 'user') ?? 'user',
              full_name: (profileData.full_name as string | null) ?? null,
              avatar_url: (profileData.avatar_url as string | null) ?? null,
            };
            setProfile(freshProfile);
            try {
              localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
            } catch {}
          } else {
            setProfile({ id: session.user.id, role: 'user' });
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          if (isMounted) setProfile({ id: session.user.id, role: 'user' });
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

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
            console.log('Profile updated in realtime:', payload);
            const newData = payload.new as any;
            const freshProfile: UserProfile = {
              id: session.user.id,
              role: (newData.role as 'admin' | 'user') ?? 'user',
              full_name: (newData.full_name as string | null) ?? null,
              avatar_url: (newData.avatar_url as string | null) ?? null,
            };
            setProfile(freshProfile);
            const cacheKey = `profile:${session.user.id}`;
            try {
              localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
            } catch {}
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
      {!loading ? children : <div className="flex items-center justify-center min-h-screen bg-[#0a0b14] text-white">Loading session...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};