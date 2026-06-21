import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser, AuthError } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async (req, { params }) => {
  const user = await requireUser(); // any signed-in role, but scoped below
  const sb = supabaseAdmin();
  const { id } = params;

  // Patients may only ever fetch their own record.
  if (user.role === 'patient' && user.patientId !== id) {
    throw new AuthError('You can only view your own record.', 403);
  }

  const { data: patient, error } = await sb.from('patients').select('*').eq('id', id).eq('hospital_id', user.hospitalId).single();
  if (error) throw error;

  const [{ data: records }, { data: appointments }, { data: family }] = await Promise.all([
    sb.from('health_records').select('*, doctors(name)').eq('patient_id', id).order('created_at', { ascending: false }),
    sb.from('appointments').select('*, doctors(name, speciality)').eq('patient_id', id).order('appointment_date', { ascending: false }),
    sb.from('family_links').select('*, member:member_patient_id(id, name, age)').eq('patient_id', id),
  ]);

  return NextResponse.json({ data: { ...patient, health_records: records || [], appointments: appointments || [], family: family || [] } });
});

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireUser(['super_admin', 'admin', 'doctor', 'nurse']);
  const sb = supabaseAdmin();
  const { id } = params;
  const body = await req.json();

  const { data, error } = await sb.from('patients').update(body).eq('id', id).eq('hospital_id', user.hospitalId).select().single();
  if (error) throw error;
  return NextResponse.json({ data });
});
