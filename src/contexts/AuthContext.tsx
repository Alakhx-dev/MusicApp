import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/auth-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  guestName: string | null;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isGuest: false,
  guestName: null,
  signOut: async () => {},
  loginAsGuest: () => {},
});

const GUEST_KEY = 'sur_isGuest';
const GUEST_NAME_KEY = 'sur_guestName';

function generateGuestName(): string {
  return `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);

  // Restore guest session from localStorage on mount
  useEffect(() => {
    const storedGuest = localStorage.getItem(GUEST_KEY);
    const storedName = localStorage.getItem(GUEST_NAME_KEY);
    if (storedGuest === 'true') {
      setIsGuest(true);
      setGuestName(storedName || generateGuestName());
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // If a real user logged in, clear any guest state
      if (session?.user) {
        localStorage.removeItem(GUEST_KEY);
        localStorage.removeItem(GUEST_NAME_KEY);
        setIsGuest(false);
        setGuestName(null);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.removeItem(GUEST_KEY);
        localStorage.removeItem(GUEST_NAME_KEY);
        setIsGuest(false);
        setGuestName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsGuest = useCallback(() => {
    const name = generateGuestName();
    localStorage.setItem(GUEST_KEY, 'true');
    localStorage.setItem(GUEST_NAME_KEY, name);
    setIsGuest(true);
    setGuestName(name);
  }, []);

  const signOut = async () => {
    // Clear guest state
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(GUEST_NAME_KEY);
    setIsGuest(false);
    setGuestName(null);
    // Also sign out of Supabase in case user was authenticated
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isGuest, guestName, signOut, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
