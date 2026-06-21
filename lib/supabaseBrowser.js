// Browser-side Supabase client. Built with @supabase/ssr's browser client
// so the auth session is stored in cookies (not localStorage) — this is
// what lets our Next.js API routes (server-side) read the same logged-in
// session via lib/auth.js's getSessionUser(). Also used for realtime
// subscriptions so changes from one role show up live for another role.
import { createBrowserClient } from '@supabase/ssr';

let _client = null;

export function supabaseBrowser() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('Supabase public env vars are missing — auth and realtime updates will not work until .env.local is set up.');
    return null;
  }

  _client = createBrowserClient(url, anonKey);
  return _client;
}
