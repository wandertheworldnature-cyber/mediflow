// Browser-side Supabase client using the public anon key.
// Used for realtime subscriptions so changes from one role (e.g. Doctor
// completing a consult) show up live for another role (e.g. Admin) without
// a manual refresh.
// NOTE: no 'use client' directive here on purpose — this is a plain utility
// module, not a component. It's only ever imported from files that already
// have 'use client' themselves (see hooks/useRealtimeTable.js).
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function supabaseBrowser() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('Supabase public env vars are missing — realtime updates will not work until .env.local is set up.');
    return null;
  }

  _client = createClient(url, anonKey);
  return _client;
}
