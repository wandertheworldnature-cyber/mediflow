import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const POST = withErrors(async (req) => {
  const user = await requireUser();
  const sb = supabaseAdmin();
  const body = await req.json(); // { patient_id, member_patient_id, relation }

  const { data, error } = await sb
    .from('family_links')
    .insert({
      hospital_id: user.hospitalId,
      patient_id: body.patient_id,
      member_patient_id: body.member_patient_id,
      relation: body.relation || null,
    })
    .select('*, member:member_patient_id(id, name, age)')
    .single();

  if (error) throw error;
  return NextResponse.json({ data });
});
