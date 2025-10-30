import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { localDB, type UserProfile } from '@/lib/localStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    let mounted = true;
    
    // Safety timeout: ensure loading state is set to false after 5 seconds max
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('AuthProvider: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);
    
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        console.log('AuthProvider: Got session from getSession()', session?.user?.id);
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Always set loading to false, even if there's an error
        clearTimeout(safetyTimeout); // Clear safety timeout on success
        
        if (session?.user) {
          syncUserProfile(session.user);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('AuthProvider: Exception getting session:', error);
        setLoading(false); // Set loading to false even on exception
        clearTimeout(safetyTimeout); // Clear safety timeout on error
      });
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('AuthProvider: Auth state changed', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Sync user profile when session changes
        if (session?.user) {
          try {
            await syncUserProfile(session.user);
          } catch (error) {
            console.error('AuthProvider: Error syncing profile on auth change:', error);
          }
        }
        
        // Always ensure loading is false after auth state change
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      console.log('AuthProvider: Unsubscribing from auth state listener');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - run only once

  const syncUserProfile = useCallback(async (user: User) => {
    try {
      console.log('AuthProvider: Syncing user profile for', user.id);
      
      // Check if profile exists in Supabase
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('AuthProvider: Error checking user profile:', profileError);
        // If it's a permission error, we might need to create the table
        if (profileError.code === '42P01') { // Undefined table
          console.log('AuthProvider: user_profiles table may not exist');
        }
      }

      if (!existingProfile) {
        console.log('AuthProvider: Creating new user profile for', user.id);
        // Create profile in Supabase if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
            username: user.email?.split('@')[0],
          });
          
        if (insertError) {
          console.error('AuthProvider: Error creating user profile:', insertError);
          // If insert fails due to missing table, we'll continue with localStorage only
        }
      }

      // Sync with localStorage for offline access
      const profile: UserProfile = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        createdAt: new Date().toISOString(),
        plan: 'free',
        settings: {
          theme: 'light',
          notifications: true,
          autoSave: true
        }
      };
      localDB.saveUserProfile(profile);
    } catch (error) {
      console.error('AuthProvider: Error syncing user profile:', error);
      // Continue with localStorage fallback
      if (user) {
        const profile: UserProfile = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          plan: 'free',
          settings: {
            theme: 'light',
            notifications: true,
            autoSave: true
          }
        };
        localDB.saveUserProfile(profile);
      }
    }
  }, []); // Empty dependency array - syncUserProfile is stable

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing in user', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthProvider: Sign in error:', error);
        return { error };
      }
      
      if (data.user) {
        await syncUserProfile(data.user);
      }
      
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('AuthProvider: Signing up user', email);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        console.error('AuthProvider: Sign up error:', error);
        return { error };
      }
      
      if (data.user) {
        await syncUserProfile(data.user);
      }
      
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error signing up:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('AuthProvider: Signing in with Google');
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true // We'll handle the redirect ourselves
        }
      });
      
      if (error) {
        console.error('AuthProvider: Google sign in error:', error);
        return { error };
      }
      
      // Redirect to the OAuth URL
      if (data?.url) {
        window.location.href = data.url;
      }
      
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error signing in with Google:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user');
      await supabase.auth.signOut();
      // Clear localStorage data on sign out
      localDB.clearUserProfile();
    } catch (error) {
      console.error('AuthProvider: Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut
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