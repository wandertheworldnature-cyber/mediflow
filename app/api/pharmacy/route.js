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

export const POST = withErrors(async (req) => {
  const user = await requireUser(['super_admin', 'admin']);
  const sb = supabaseAdmin();
  const body = await req.json();
  if (!body.medicine_name) return NextResponse.json({ error: 'Medicine name is required.' }, { status: 400 });

  const { data, error } = await sb.from('pharmacy_stock').insert({
    hospital_id: user.hospitalId,
    medicine_name: body.medicine_name,
    quantity: body.quantity || 0,
    expiry_date: body.expiry_date || null,
    low_stock_threshold: body.low_stock_threshold || 50,
  }).select().single();
  if (error) throw error;
  return NextResponse.json({ data });
});
