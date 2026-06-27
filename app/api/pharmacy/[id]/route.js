import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireUser(['super_admin', 'admin']);
  const sb = supabaseAdmin();
  const { id } = params;
  const body = await req.json();

  const allowed = {};
  for (const key of ['medicine_name', 'quantity', 'expiry_date', 'low_stock_threshold']) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }

  const { data, error } = await sb
    .from('pharmacy_stock')
    .update(allowed)
    .eq('id', id)
    .eq('hospital_id', user.hospitalId)
    .select()
    .single();
  if (error) throw error;
  return NextResponse.json({ data });
});

export const DELETE = withErrors(async (req, { params }) => {
  const user = await requireUser(['super_admin', 'admin']);
  const sb = supabaseAdmin();
  const { id } = params;

  const { error } = await sb
    .from('pharmacy_stock')
    .delete()
    .eq('id', id)
    .eq('hospital_id', user.hospitalId);
  if (error) throw error;
  return NextResponse.json({ data: { deleted: id } });
});
