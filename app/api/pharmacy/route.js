import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('pharmacy_stock').select('*').order('medicine_name');
    if (error) throw error;
    const withStatus = data.map((m) => ({ ...m, status: m.quantity <= m.low_stock_threshold ? 'low' : 'ok' }));
    return NextResponse.json({ data: withStatus });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
