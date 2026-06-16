import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { AuthState, SubscriptionPlan } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoaded: false });

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        setState({
          user: {
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            plan: (clerkUser.publicMetadata?.plan as SubscriptionPlan) || 'free',
            createdAt: clerkUser.createdAt ? clerkUser.createdAt.toISOString() : new Date().toISOString(),
          },
          isAuthenticated: true,
          isLoaded: true,
        });
      } else {
        setState({ user: null, isAuthenticated: false, isLoaded: true });
      }
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const login = useCallback(async (email: string, password: string) => {
    // Left as stub since Clerk handles authentication natively via <SignIn />
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    // Left as stub since Clerk handles registration natively via <SignUp />
  }, []);

  const logout = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
