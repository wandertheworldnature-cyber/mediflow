import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const GET = withErrors(async () => {
  const user = await requireUser(['super_admin', 'admin', 'nurse']);
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('nurse_tasks').select('*').eq('hospital_id', user.hospitalId).order('created_at');
  if (error) throw error;
  return NextResponse.json({ data });
});

export const POST = withErrors(async (req) => {
  const user = await requireUser(['super_admin', 'admin', 'nurse']);
  const sb = supabaseAdmin();
  const body = await req.json();
  const { data, error } = await sb.from('nurse_tasks').insert({ hospital_id: user.hospitalId, title: body.title, task_time: body.task_time || '' }).select().single();
  if (error) throw error;
  return NextResponse.json({ data });
});
