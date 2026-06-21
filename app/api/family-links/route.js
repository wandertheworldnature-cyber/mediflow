import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const sb = supabaseAdmin();
    const body = await req.json(); // { patient_id, member_patient_id, relation }

    const { data, error } = await sb
      .from('family_links')
      .insert({
        patient_id: body.patient_id,
        member_patient_id: body.member_patient_id,
        relation: body.relation || null,
      })
      .select('*, member:member_patient_id(id, name, age)')
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
