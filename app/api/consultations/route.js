import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async (req) => {
  const user = await requireUser();
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patient_id');

  let query = sb.from('consultations').select('*, doctors(name, speciality)').eq('hospital_id', user.hospitalId).order('created_at', { ascending: false });

  if (user.role === 'patient') query = query.eq('patient_id', user.patientId);
  else if (patientId) query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) throw error;
  return NextResponse.json({ data });
});

// Saving a consultation is the "connected" moment: it creates the consult
// record, optionally a prescription, marks the appointment completed, and
// adds a health record the patient will see — all scoped to the doctor's
// own hospital.
export const POST = withErrors(async (req) => {
  const user = await requireUser(['doctor', 'admin', 'super_admin']);
  const sb = supabaseAdmin();
  const body = await req.json();
  const { appointment_id, patient_id, doctor_id, symptoms, diagnosis, notes, ai_generated, medicines } = body;

  const { data: consultation, error: cErr } = await sb
    .from('consultations')
    .insert({ hospital_id: user.hospitalId, appointment_id, patient_id, doctor_id, symptoms, diagnosis, notes, ai_generated: !!ai_generated })
    .select()
    .single();
  if (cErr) throw cErr;

  let prescription = null;
  if (medicines && medicines.length > 0) {
    const { data: presc, error: pErr } = await sb
      .from('prescriptions')
      .insert({ hospital_id: user.hospitalId, consultation_id: consultation.id, patient_id, doctor_id, medicines })
      .select()
      .single();
    if (pErr) throw pErr;
    prescription = presc;
  }

  if (appointment_id) {
    await sb.from('appointments').update({ status: 'completed' }).eq('id', appointment_id).eq('hospital_id', user.hospitalId);
  }

  await sb.from('health_records').insert({
    hospital_id: user.hospitalId,
    patient_id,
    record_type: `Consultation — ${diagnosis ? diagnosis.slice(0, 60) : 'General visit'}`,
    doctor_id,
    status: 'Active',
  });

  return NextResponse.json({ data: { consultation, prescription } });
});
