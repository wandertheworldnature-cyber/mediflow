import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req, { params }) {
  try {
    const sb = supabaseAdmin();
    const { id } = params;

    const { data: patient, error } = await sb.from('patients').select('*').eq('id', id).single();
    if (error) throw error;

    const [{ data: records }, { data: appointments }, { data: family }] = await Promise.all([
      sb.from('health_records').select('*, doctors(name)').eq('patient_id', id).order('created_at', { ascending: false }),
      sb.from('appointments').select('*, doctors(name, speciality)').eq('patient_id', id).order('appointment_date', { ascending: false }),
      sb.from('family_links').select('*, member:member_patient_id(id, name, age)').eq('patient_id', id),
    ]);

    return NextResponse.json({ data: { ...patient, health_records: records || [], appointments: appointments || [], family: family || [] } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const sb = supabaseAdmin();
    const { id } = params;
    const body = await req.json();

    const { data, error } = await sb.from('patients').update(body).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
