import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async () => {
  const user = await requireUser(['super_admin', 'admin', 'doctor', 'nurse']);
  const sb = supabaseAdmin();

  const { data: wards, error } = await sb.from('wards').select('*').eq('hospital_id', user.hospitalId).order('name');
  if (error) throw error;

  const { data: beds, error: bErr } = await sb
    .from('beds')
    .select('*, patients(id, name)')
    .eq('hospital_id', user.hospitalId)
    .order('bed_number');
  if (bErr) throw bErr;

  const result = wards.map((w) => ({
    ...w,
    beds: beds.filter((b) => b.ward_id === w.id),
    occupied: beds.filter((b) => b.ward_id === w.id && b.status === 'occupied').length,
  }));

  return NextResponse.json({ data: result });
});
