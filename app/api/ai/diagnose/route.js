import { NextResponse } from 'next/server';
import { generateDiagnosisSuggestion } from '@/lib/groq';

export async function POST(req) {
  try {
    const { symptoms, patientAge, patientGender } = await req.json();
    if (!symptoms || symptoms.trim().length < 3) {
      return NextResponse.json({ error: 'Symptoms are required.' }, { status: 400 });
    }
    const result = await generateDiagnosisSuggestion({ symptoms, patientAge, patientGender });
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
