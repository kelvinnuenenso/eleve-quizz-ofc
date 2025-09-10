import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { localDB, type UserProfile } from '@/lib/localStorage';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (mock)
    const profile = localDB.getUserProfile();
    if (profile) {
      setUser({
        id: profile.id,
        email: profile.email,
        user_metadata: {
          full_name: profile.name
        }
      });
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in - in a real app this would validate credentials
    const mockUser: User = {
      id: 'mock-user-id',
      email: email,
      user_metadata: {
        full_name: email.split('@')[0]
      }
    };

    // Create or get user profile
    let profile = localDB.getUserProfile();
    if (!profile) {
      profile = {
        id: mockUser.id,
        name: mockUser.user_metadata?.full_name || email.split('@')[0],
        email: email,
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

    setUser(mockUser);
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Mock sign up
    const mockUser: User = {
      id: crypto.randomUUID(),
      email: email,
      user_metadata: {
        full_name: fullName || email.split('@')[0]
      }
    };

    // Create user profile
    const profile: UserProfile = {
      id: mockUser.id,
      name: fullName || email.split('@')[0],
      email: email,
      createdAt: new Date().toISOString(),
      plan: 'free',
      settings: {
        theme: 'light',
        notifications: true,
        autoSave: true
      }
    };

    localDB.saveUserProfile(profile);
    setUser(mockUser);
  };

  const signOut = async () => {
    // In a real app, this would call the auth service
    setUser(null);
    // Note: We don't clear the profile data so user can sign back in
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
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