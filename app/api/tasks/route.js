import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb.from('nurse_tasks').select('*').order('created_at');
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
    const { data, error } = await sb.from('nurse_tasks').insert({ title: body.title, task_time: body.task_time || '' }).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
