import { NextResponse } from 'next/server';
import { generateScribeNote } from '@/lib/groq';

export async function POST(req) {
  try {
    const { transcript } = await req.json();
    if (!transcript || transcript.trim().length < 3) {
      return NextResponse.json({ error: 'Transcript is empty.' }, { status: 400 });
    }
    const result = await generateScribeNote({ transcript });
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
