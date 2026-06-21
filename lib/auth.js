// Server-side auth helper used by every API route. Reads the Supabase
// session from the request's cookies, verifies it against Supabase Auth,
// and looks up the caller's real role + hospital_id from user_profiles —
// never trusting anything the client claims about its own role.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function getSessionUser() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Use the admin client (service role) for this lookup so it isn't
  // subject to RLS recursion issues — we ARE the trusted source of truth
  // resolving who this user is.
  const sb = supabaseAdmin();
  const { data: profile, error: profileErr } = await sb
    .from('user_profiles')
    .select('*, hospitals(name, status)')
    .eq('id', user.id)
    .single();

  if (profileErr || !profile) return null;

  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    hospitalId: profile.hospital_id,
    hospitalName: profile.hospitals?.name || null,
    hospitalStatus: profile.hospitals?.status || null,
    fullName: profile.full_name,
    doctorId: profile.doctor_id,
    patientId: profile.patient_id,
  };
}

// Throws a tagged error if the caller isn't signed in, or isn't one of the
// allowed roles. API routes catch this and turn it into a 401/403.
export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(allowedRoles) {
  const user = await getSessionUser();
  if (!user) throw new AuthError('Not signed in.', 401);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError(`This action requires one of: ${allowedRoles.join(', ')}.`, 403);
  }
  if (user.role !== 'super_admin' && user.hospitalStatus === 'suspended') {
    throw new AuthError('This hospital account is suspended. Contact your administrator.', 403);
  }
  return user;
}
