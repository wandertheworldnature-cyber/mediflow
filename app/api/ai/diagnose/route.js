import { NextResponse } from 'next/server';
import { generateDiagnosisSuggestion } from '@/lib/groq';
import { requireUser } from '@/lib/auth';
import { withErrors } from '@/lib/withErrors';

export const POST = withErrors(async (req) => {
  await requireUser(['doctor', 'admin', 'super_admin']);
  const { symptoms, patientAge, patientGender } = await req.json();
  if (!symptoms || symptoms.trim().length < 3) {
    return NextResponse.json({ error: 'Symptoms are required.' }, { status: 400 });
  }
  const result = await generateDiagnosisSuggestion({ symptoms, patientAge, patientGender });
  return NextResponse.json({ data: result });
});
