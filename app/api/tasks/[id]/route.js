import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req, { params }) {
  try {
    const sb = supabaseAdmin();
    const { id } = params;
    const body = await req.json();
    const { data, error } = await sb.from('nurse_tasks').update(body).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
