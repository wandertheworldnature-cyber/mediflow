import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');

    let query = sb.from('consultations').select('*, doctors(name, speciality)').order('created_at', { ascending: false });
    if (patientId) query = query.eq('patient_id', patientId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Saving a consultation is the "connected" moment: it creates the consult
// record, optionally a prescription, marks the appointment completed, and
// adds a health record the patient will see in their app — all in one call.
export async function POST(req) {
  try {
    const sb = supabaseAdmin();
    const body = await req.json();
    const { appointment_id, patient_id, doctor_id, symptoms, diagnosis, notes, ai_generated, medicines } = body;

    const { data: consultation, error: cErr } = await sb
      .from('consultations')
      .insert({ appointment_id, patient_id, doctor_id, symptoms, diagnosis, notes, ai_generated: !!ai_generated })
      .select()
      .single();
    if (cErr) throw cErr;

    let prescription = null;
    if (medicines && medicines.length > 0) {
      const { data: presc, error: pErr } = await sb
        .from('prescriptions')
        .insert({ consultation_id: consultation.id, patient_id, doctor_id, medicines })
        .select()
        .single();
      if (pErr) throw pErr;
      prescription = presc;
    }

    if (appointment_id) {
      await sb.from('appointments').update({ status: 'completed' }).eq('id', appointment_id);
    }

    await sb.from('health_records').insert({
      patient_id,
      record_type: `Consultation — ${diagnosis ? diagnosis.slice(0, 60) : 'General visit'}`,
      doctor_id,
      status: 'Active',
    });

    return NextResponse.json({ data: { consultation, prescription } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
