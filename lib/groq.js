// Server-only Groq client + prompt helpers for MediFlow's AI features.
// Model choice: llama-3.3-70b-versatile is Groq's strong general model as of
// writing — fast and capable for structured medical-note generation and Q&A.
// If Groq deprecates this model name, swap it here in one place.
import Groq from 'groq-sdk';

let _client = null;
function client() {
  if (_client) return _client;
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Missing GROQ_API_KEY in .env.local. Get a free key at https://console.groq.com/keys');
  }
  _client = new Groq({ apiKey: key });
  return _client;
}

const MODEL = 'llama-3.3-70b-versatile';

const SAFETY_NOTE_EN =
  'This is an AI-generated suggestion to assist a licensed doctor. It is not a diagnosis and must be reviewed and approved by the treating physician before use.';
const SAFETY_NOTE_TE =
  'ఇది లైసెన్స్ పొందిన వైద్యుడికి సహాయపడే AI సూచన మాత్రమే. ఇది రోగనిర్ధారణ కాదు, ఉపయోగించే ముందు చికిత్స చేసే వైద్యుడు సమీక్షించి ఆమోదించాలి.';

// ---- 1. AI Medical Scribe: turns a doctor's spoken/typed notes into structured fields ----
export async function generateScribeNote({ transcript }) {
  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a clinical scribe assistant for doctors in Andhra Pradesh, India. 
Given a doctor's spoken consultation notes, extract structured fields.
Respond ONLY with strict JSON in this exact shape, no markdown, no extra text:
{
  "symptoms": "comma-separated symptoms",
  "diagnosis": "likely diagnosis, phrased cautiously (e.g. 'Likely: ...')",
  "suggested_medicines": "medicine name, dosage, duration — comma separated, generic/common OTC-tier suggestions only",
  "lab_recommendations": "any recommended tests, or empty string if none"
}
Be conservative. Never suggest controlled substances, opioids, or anything requiring specialist sign-off beyond a general physician. If symptoms suggest an emergency (chest pain, breathing difficulty, stroke signs), say so plainly in diagnosis and recommend immediate escalation instead of routine medicines.`,
      },
      { role: 'user', content: transcript },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { symptoms: '', diagnosis: 'Could not parse AI response', suggested_medicines: '', lab_recommendations: '' };
  }
  return { ...parsed, disclaimer_en: SAFETY_NOTE_EN, disclaimer_te: SAFETY_NOTE_TE };
}

// ---- 2. AI Prescription Assistant: symptoms -> suggestions (doctor approves) ----
export async function generateDiagnosisSuggestion({ symptoms, patientAge, patientGender }) {
  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an AI clinical decision support tool for doctors (not patients) in an Indian general hospital.
Given short symptom input, respond ONLY with strict JSON:
{
  "likely_diagnosis": "1-2 likely diagnoses, phrased as possibilities not certainties",
  "common_medicines": "common first-line medicines with dosage and duration, comma separated",
  "lab_recommendations": "relevant tests to confirm, comma separated, or empty string",
  "red_flags": "any emergency warning signs to watch for, or empty string if none"
}
Patient context: age ${patientAge || 'unknown'}, gender ${patientGender || 'unknown'}.
Be conservative and never suggest controlled substances. This is a suggestion for the doctor to review, not a final prescription.`,
      },
      { role: 'user', content: symptoms },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { likely_diagnosis: 'Could not parse AI response', common_medicines: '', lab_recommendations: '', red_flags: '' };
  }
  return { ...parsed, disclaimer_en: SAFETY_NOTE_EN, disclaimer_te: SAFETY_NOTE_TE };
}

// ---- 3. AI Health Assistant: patient-facing Q&A, English or Telugu ----
export async function answerPatientQuestion({ question, lang = 'en', history = [] }) {
  const systemPrompt =
    lang === 'te'
      ? `మీరు MediFlow ఆరోగ్య సహాయకుడు — భారతదేశంలోని రోగుల కోసం స్నేహపూర్వక, సరళమైన ఆరోగ్య సమాచార సహాయకుడు. తెలుగులో సరళంగా సమాధానం ఇవ్వండి. మీరు వైద్యుడు కాదు — ఎప్పుడూ రోగనిర్ధారణ చేయవద్దు లేదా మందుల మోతాదులు సూచించవద్దు. తీవ్రమైన లక్షణాల గురించి అడిగితే, వెంటనే వైద్యుడిని సంప్రదించమని చెప్పండి. సమాధానాలు చిన్నవిగా మరియు స్పష్టంగా ఉంచండి (3-4 వాక్యాలు).`
      : `You are the MediFlow Health Assistant — a friendly, simple health information helper for patients in India. Answer in plain, simple English. You are NOT a doctor — never diagnose or give specific medicine dosages. If asked about serious symptoms, tell them to consult a doctor immediately. Keep answers short and clear (3-4 sentences). You can explain what common medical terms or report values mean in general terms.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages,
  });

  return completion.choices[0]?.message?.content || (lang === 'te' ? 'క్షమించండి, సమాధానం ఇవ్వలేకపోయాను.' : 'Sorry, I could not generate a response.');
}
