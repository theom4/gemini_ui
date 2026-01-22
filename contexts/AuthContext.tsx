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

    const initializeAuth = async () => {
      try {
        // 1. Get Session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (mounted) {
          setSession(session);
        }

        // 2. If Session exists, try to get Profile
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
                   });
                 } else {
                   // Profile doesn't exist or error in fetch
                   setProfile({ id: session.user.id, role: 'user' });
                 }
               }
           } catch (profileError) {
               console.warn("Profile fetch failed, defaulting to basic user", profileError);
               if (mounted) setProfile({ id: session.user.id, role: 'user' });
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

    // 3. Set up Real-time Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        // Update session
        setSession(session);

        if (event === 'SIGNED_OUT') {
             setProfile(null);
             // Ensure loading is cleared on sign out
             setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
             // We generally handle profile fetch in initializeAuth, but if this happens 
             // after initial load (e.g. magic link), we might need profile.
             // For now, relies on the fact that if we have a session, we let the user in.
             setLoading(false);
        }
    });

    // 4. Fail-safe timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            console.warn("Auth loading timed out, forcing render.");
            setLoading(false);
        }
    }, 3000); // 3 seconds max

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []); // Remove loading dependency to avoid re-running

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