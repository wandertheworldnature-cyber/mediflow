import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data: wards, error } = await sb.from('wards').select('*').order('name');
    if (error) throw error;

    const { data: beds, error: bErr } = await sb
      .from('beds')
      .select('*, patients(id, name)')
      .order('bed_number');
    if (bErr) throw bErr;

    const result = wards.map((w) => ({
      ...w,
      beds: beds.filter((b) => b.ward_id === w.id),
      occupied: beds.filter((b) => b.ward_id === w.id && b.status === 'occupied').length,
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
