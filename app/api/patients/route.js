import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async (req) => {
  const user = await requireUser(['super_admin', 'admin', 'doctor', 'nurse']);
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const uhid = searchParams.get('uhid');

  let query = sb.from('patients').select('*').eq('hospital_id', user.hospitalId).order('created_at', { ascending: false });
  if (uhid) query = sb.from('patients').select('*').eq('hospital_id', user.hospitalId).eq('uhid', uhid).single();
  else if (q) query = query.or(`name.ilike.%${q}%,uhid.ilike.%${q}%,mobile.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return NextResponse.json({ data });
});

export const POST = withErrors(async (req) => {
  const user = await requireUser(['super_admin', 'admin', 'doctor', 'nurse']);
  const sb = supabaseAdmin();
  const body = await req.json();

  const uhid = body.uhid || `AP-${Math.floor(20000 + Math.random() * 9999)}`;

  const { data, error } = await sb
    .from('patients')
    .insert({
      hospital_id: user.hospitalId,
      uhid,
      name: body.name,
      mobile: body.mobile || null,
      age: body.age || null,
      gender: body.gender || null,
      blood_group: body.blood_group || null,
      allergies: body.allergies || null,
      chronic_conditions: body.chronic_conditions || null,
      emergency_contact: body.emergency_contact || null,
      status: body.status || 'OPD',
    })
    .select()
    .single();

  if (error) throw error;
  return NextResponse.json({ data });
});
