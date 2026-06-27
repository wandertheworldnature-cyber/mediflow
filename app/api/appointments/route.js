import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser, AuthError } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async (req) => {
  const user = await requireUser();
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get('doctor_id');
  const patientId = searchParams.get('patient_id');
  const date = searchParams.get('date');
  const status = searchParams.get('status');

  let query = sb
    .from('appointments')
    .select('*, patients(id, name, age, gender, uhid), doctors(id, name, speciality, speciality_te, color, avatar_initials)')
    .eq('hospital_id', user.hospitalId)
    .order('appointment_time', { ascending: true });

  // Patients can only ever see their own appointments, regardless of what
  // patient_id they pass in.
  if (user.role === 'patient') {
    query = query.eq('patient_id', user.patientId);
  } else if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  if (doctorId) query = query.eq('doctor_id', doctorId);
  if (date) query = query.eq('appointment_date', date);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return NextResponse.json({ data });
});

export const POST = withErrors(async (req) => {
  const user = await requireUser();
  const sb = supabaseAdmin();
  const body = await req.json();

  // Patients can only book for themselves.
  const patientId = user.role === 'patient' ? user.patientId : body.patient_id;
  if (!patientId) throw new AuthError('patient_id is required.', 400);

  const { data, error } = await sb
    .from('appointments')
    .insert({
      hospital_id: user.hospitalId,
      patient_id: patientId,
      doctor_id: body.doctor_id,
      appointment_date: body.appointment_date || new Date().toISOString().slice(0, 10),
      appointment_time: body.appointment_time,
      reason: body.reason || null,
      // Patients booking themselves → pending until admin confirms.
      // Admin/staff booking walk-ins → confirmed immediately.
      status: user.role === 'patient' ? 'pending' : (body.status || 'confirmed'),
    })
    .select('*, patients(id, name, age, gender, uhid), doctors(id, name, speciality, color)')
    .single();

  if (error) throw error;
  return NextResponse.json({ data });
});
