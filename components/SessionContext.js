'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// This is a lightweight DEMO session, not real authentication. It lets
// someone pick a role (Admin / Doctor / Nurse / Patient) and, for the
// patient role, pick which seeded patient record they are. There is no
// password check and no per-user account system — every visitor with the
// URL can act as any role. That's fine for an internal demo / pilot, but
// if you put real patient data into this, you should replace this with
// real auth (e.g. Supabase Auth) before going further than a demo.
const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSessionState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('mediflow_session') : null;
    if (saved) {
      try { setSessionState(JSON.parse(saved)); } catch {}
    }
    setLoaded(true);
  }, []);

  const setSession = (s) => {
    setSessionState(s);
    if (typeof window !== 'undefined') {
      if (s) window.localStorage.setItem('mediflow_session', JSON.stringify(s));
      else window.localStorage.removeItem('mediflow_session');
    }
  };

  return <SessionCtx.Provider value={{ session, setSession, loaded }}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  return useContext(SessionCtx);
}
