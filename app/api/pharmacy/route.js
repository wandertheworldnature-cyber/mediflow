import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async () => {
  const user = await requireUser(['super_admin', 'admin', 'doctor', 'nurse']);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('pharmacy_stock').select('*').eq('hospital_id', user.hospitalId).order('medicine_name');
  if (error) throw error;
  const withStatus = data.map((m) => ({ ...m, status: m.quantity <= m.low_stock_threshold ? 'low' : 'ok' }));
  return NextResponse.json({ data: withStatus });
});
