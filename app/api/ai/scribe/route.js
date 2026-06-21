import { NextResponse } from 'next/server';
import { generateScribeNote } from '@/lib/groq';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const POST = withErrors(async (req) => {
  await requireUser(['doctor', 'admin', 'super_admin']);
  const { transcript } = await req.json();
  if (!transcript || transcript.trim().length < 3) {
    return NextResponse.json({ error: 'Transcript is empty.' }, { status: 400 });
  }
  const result = await generateScribeNote({ transcript });
  return NextResponse.json({ data: result });
});
