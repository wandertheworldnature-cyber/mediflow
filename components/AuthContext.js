'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

// Real authentication context. Tracks the Supabase Auth session and the
// caller's profile (role, hospital_id, etc.) fetched from our own API so
// the client always has a verified view of who's logged in — the actual
// access control still happens server-side in API routes via lib/auth.js,
// this context is just for driving the UI.
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, role, hospitalId, fullName, ... } or null
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = await res.json();
      setUser(json.data || null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) {
      setLoading(false);
      return;
    }

    refreshProfile().finally(() => setLoading(false));

    const { data: listener } = sb.auth.onAuthStateChange((_event, _session) => {
      refreshProfile();
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    const sb = supabaseBrowser();
    await sb?.auth.signOut();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, refreshProfile, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
