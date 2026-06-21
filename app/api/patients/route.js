import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req) {
  try {
    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const uhid = searchParams.get('uhid');

    let query = sb.from('patients').select('*').order('created_at', { ascending: false });
    if (uhid) query = sb.from('patients').select('*').eq('uhid', uhid).single();
    else if (q) query = query.or(`name.ilike.%${q}%,uhid.ilike.%${q}%,mobile.ilike.%${q}%`);

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

    const uhid = body.uhid || `AP-${Math.floor(20000 + Math.random() * 9999)}`;

    const { data, error } = await sb
      .from('patients')
      .insert({
        uhid,
        name: body.name,
        mobile: body.mobile || null,
        age: body.age || null,
        gender: body.gender || null,
        blood_group: body.blood_group || null,
        allergies: body.allergies || null,
        chronic_conditions: body.chronic_conditions || null,
        emergency_contact: body.emergency_contact || null,
        status: body.status || 'OPD',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
