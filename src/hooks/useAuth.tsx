import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PlanType } from '@/lib/planManager';
import { localDB, type UserProfile } from '@/lib/localStorage';
import { syncManager } from '@/lib/syncManager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  upgradePlan: (newPlan: PlanType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Sync user profile when session changes
        if (session?.user) {
          setTimeout(() => {
            syncUserProfile(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        syncUserProfile(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (user: User) => {
    try {
      // Check if profile exists in Supabase
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let userProfile: UserProfile;

      if (!existingProfile) {
        // Create profile in Supabase if it doesn't exist
        const newProfile = {
          user_id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          avatar_url: user.user_metadata?.avatar_url,
          plan: 'starter' as PlanType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        userProfile = createdProfile || {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          avatar_url: user.user_metadata?.avatar_url,
          plan: 'starter' as PlanType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        userProfile = {
          id: existingProfile.user_id,
          email: existingProfile.email,
          name: existingProfile.name,
          avatar_url: existingProfile.avatar_url,
          plan: existingProfile.plan || 'starter',
          plan_expires_at: existingProfile.plan_expires_at,
          created_at: existingProfile.created_at,
          updated_at: existingProfile.updated_at,
        };
      }

      setProfile(userProfile);

      // Sync with localStorage for offline access
      const legacyProfile = {
        id: user.id,
        name: userProfile.name || 'Usuário',
        email: userProfile.email,
        createdAt: userProfile.created_at,
        plan: 'free', // Keep legacy format for compatibility
        settings: {
          theme: 'light',
          notifications: true,
          autoSave: true
        }
      };
      localDB.saveUserProfile(legacyProfile);
      
      // Trigger full data sync if needed
      if (syncManager.shouldSync()) {
        syncManager.syncUserData(user.id).catch(error => {
          console.error('Background sync failed:', error);
        });
      }
      
    } catch (error) {
      console.error('Error syncing user profile:', error);
      // Fallback to basic profile
      const fallbackProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url,
        plan: 'starter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${siteUrl}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${siteUrl}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear localStorage data on sign out
      localDB.clearUserProfile();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const updatedProfile = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updatedProfile)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const upgradePlan = async (newPlan: PlanType) => {
    if (!user || !profile) return;

    try {
      const planExpiry = new Date();
      planExpiry.setMonth(planExpiry.getMonth() + 1); // 1 mês de validade

      const updates = {
        plan: newPlan,
        plan_expires_at: planExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success(`Plano atualizado para ${newPlan.toUpperCase()}!`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      upgradePlan,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}