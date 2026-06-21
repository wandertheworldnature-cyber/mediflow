import { NextResponse } from 'next/server';
import { answerPatientQuestion } from '@/lib/groq';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Lightweight keyword check for self-harm / crisis language. If matched, we
// skip the general-purpose model and return India-specific crisis resources
// directly instead, the same way the rest of MediFlow should handle this.
const CRISIS_PATTERNS = [
  /suicid/i, /kill myself/i, /end my life/i, /self.?harm/i, /hurt myself/i,
  /ఆత్మహత్య/, /చనిపోవాలి/, /చావాలి/,
];

function isCrisisMessage(text) {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}

const CRISIS_RESPONSE_EN = `I'm really sorry you're going through this. I can't help with that question directly, but please reach out for support right now:

• iCall (India): 9152987821 (Mon–Sat, 8am–10pm)
• AASRA: 9820466726 (24x7)
• Or go to your nearest hospital emergency department.

You don't have to go through this alone — please talk to someone you trust or a mental health professional today.`;

const CRISIS_RESPONSE_TE = `మీరు ఎదుర్కొంటున్న దానికి నాకు చాలా బాధగా ఉంది. ఈ ప్రశ్నకు నేను నేరుగా సహాయం చేయలేను, దయచేసి ఇప్పుడే సహాయం తీసుకోండి:

• iCall (India): 9152987821 (సోమ-శని, ఉదయం 8 - రాత్రి 10)
• AASRA: 9820466726 (24x7)
• లేదా సమీప ఆసుపత్రి అత్యవసర విభాగానికి వెళ్లండి.

మీరు ఒంటరిగా దీన్ని ఎదుర్కోవాల్సిన అవసరం లేదు — దయచేసి మీరు నమ్మే వ్యక్తితో లేదా మానసిక ఆరోగ్య నిపుణుడితో ఈరోజే మాట్లాడండి.`;

export async function POST(req) {
  try {
    const { patient_id, question, lang = 'en' } = await req.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const sb = supabaseAdmin();

    let history = [];
    if (patient_id) {
      const { data } = await sb
        .from('ai_chat_messages')
        .select('role, content')
        .eq('patient_id', patient_id)
        .order('created_at', { ascending: true })
        .limit(12);
      history = data || [];

      await sb.from('ai_chat_messages').insert({ patient_id, role: 'user', content: question, lang });
    }

    let answer;
    if (isCrisisMessage(question)) {
      answer = lang === 'te' ? CRISIS_RESPONSE_TE : CRISIS_RESPONSE_EN;
    } else {
      answer = await answerPatientQuestion({ question, lang, history });
    }

    if (patient_id) {
      await sb.from('ai_chat_messages').insert({ patient_id, role: 'assistant', content: answer, lang });
    }

    return NextResponse.json({ data: { answer } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');
    if (!patientId) return NextResponse.json({ data: [] });

    const { data, error } = await sb
      .from('ai_chat_messages')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
