import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctor_id');
    const patientId = searchParams.get('patient_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = sb
      .from('appointments')
      .select('*, patients(id, name, age, gender, uhid), doctors(id, name, speciality, speciality_te, color, avatar_initials)')
      .order('appointment_time', { ascending: true });

    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (patientId) query = query.eq('patient_id', patientId);
    if (date) query = query.eq('appointment_date', date);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sb = supabaseAdmin();
    const body = await req.json();

    const { data, error } = await sb
      .from('appointments')
      .insert({
        patient_id: body.patient_id,
        doctor_id: body.doctor_id,
        appointment_date: body.appointment_date || new Date().toISOString().slice(0, 10),
        appointment_time: body.appointment_time,
        reason: body.reason || null,
        status: body.status || 'confirmed',
      })
      .select('*, patients(id, name, age, gender, uhid), doctors(id, name, speciality, color)')
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
