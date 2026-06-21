import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser, AuthError } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser(['super_admin']);
    const sb = supabaseAdmin();

    const { data: hospitals, error } = await sb.from('hospitals').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    // Attach quick stats per hospital (patient count, doctor count) so the
    // Super Admin dashboard has something useful to show without N+1 calls
    // from the client.
    const { data: patientCounts } = await sb.from('patients').select('hospital_id');
    const { data: doctorCounts } = await sb.from('doctors').select('hospital_id');

    const withStats = hospitals.map((h) => ({
      ...h,
      patient_count: (patientCounts || []).filter((p) => p.hospital_id === h.id).length,
      doctor_count: (doctorCounts || []).filter((d) => d.hospital_id === h.id).length,
    }));

    return NextResponse.json({ data: withStats });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requireUser(['super_admin']);
    const sb = supabaseAdmin();
    const body = await req.json();

    if (!body.name) return NextResponse.json({ error: 'Hospital name is required.' }, { status: 400 });

    const { data, error } = await sb
      .from('hospitals')
      .insert({ name: body.name, city: body.city || null, state: body.state || null, plan: body.plan || 'trial', status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
