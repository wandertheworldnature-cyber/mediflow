// Server-only Supabase client using the service role key.
// NEVER import this from a "use client" component — it must only run in
// API routes / server components, since the service role key bypasses RLS.
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function supabaseAdmin() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase env vars. Did you create .env.local from .env.example and fill in NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY?'
    );
  }

  _client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return _client;
}
