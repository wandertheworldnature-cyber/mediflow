import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async () => {
  const user = await requireUser(); // any signed-in role can see doctor list (needed for booking)
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('doctors').select('*').eq('hospital_id', user.hospitalId).order('name');
  if (error) throw error;
  return NextResponse.json({ data });
});
