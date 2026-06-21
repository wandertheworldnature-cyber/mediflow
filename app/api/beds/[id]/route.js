import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const PATCH = withErrors(async (req, { params }) => {
  const user = await requireUser(['super_admin', 'admin', 'nurse', 'doctor']);
  const sb = supabaseAdmin();
  const { id } = params;
  const body = await req.json(); // { status, patient_id?, note? }

  const update = { status: body.status, updated_at: new Date().toISOString() };
  if (body.status === 'occupied') {
    update.patient_id = body.patient_id || null;
    update.note = body.note || 'Stable';
    if (body.patient_id) {
      await sb.from('patients').update({ status: 'Admitted' }).eq('id', body.patient_id).eq('hospital_id', user.hospitalId);
    }
  }
  if (body.status === 'cleaning' || body.status === 'available') {
    const { data: current } = await sb.from('beds').select('patient_id').eq('id', id).eq('hospital_id', user.hospitalId).single();
    if (current?.patient_id) {
      await sb.from('patients').update({ status: 'Discharged' }).eq('id', current.patient_id).eq('hospital_id', user.hospitalId);
    }
    update.patient_id = null;
    update.note = null;
  }

  const { data, error } = await sb.from('beds').update(update).eq('id', id).eq('hospital_id', user.hospitalId).select('*, patients(id, name)').single();
  if (error) throw error;
  return NextResponse.json({ data });
});
