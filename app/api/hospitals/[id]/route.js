import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser, AuthError } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    await requireUser(['super_admin']);
    const sb = supabaseAdmin();
    const { id } = params;
    const body = await req.json(); // { status?, plan?, name?, city?, state? }

    const allowed = {};
    for (const key of ['status', 'plan', 'name', 'city', 'state']) {
      if (body[key] !== undefined) allowed[key] = body[key];
    }

    const { data, error } = await sb.from('hospitals').update(allowed).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
