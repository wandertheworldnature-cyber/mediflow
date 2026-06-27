import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

// Returns pending appointment requests for the admin to approve.
export const GET = withErrors(async () => {
  const user = await requireUser(['super_admin', 'admin']);
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('appointments')
    .select('*, patients(name, uhid), doctors(name, speciality)')
    .eq('hospital_id', user.hospitalId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return NextResponse.json({ data: data || [] });
});
