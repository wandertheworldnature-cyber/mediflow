import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireUser(['super_admin', 'admin', 'doctor', 'nurse']);
  const sb = supabaseAdmin();
  const { id } = params;
  const body = await req.json();

  const { data, error } = await sb.from('appointments').update(body).eq('id', id).eq('hospital_id', user.hospitalId).select().single();
  if (error) throw error;
  return NextResponse.json({ data });
});
