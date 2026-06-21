'use client';
import { useState, useEffect, useCallback } from 'react';
import { TopBar, SubNav, StatCard, CenterLoader, Spinner } from '@/components/Shell';
import { T, t, useLang } from '@/components/LangContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useToast } from '@/hooks/useToast';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { api } from '@/lib/api';
import { I } from '@/components/icons';

export default function DoctorPage() {
  const { ready, session } = useRequireRole('doctor');
  const toast = useToast();
  const [tab, setTab] = useState('queue');
  const [activeAppt, setActiveAppt] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);

  useEffect(() => {
    if (!ready || !session?.doctorId) return;
    api('/doctors').then((docs) => {
      setDoctor((docs || []).find((d) => d.id === session.doctorId) || null);
    }).catch((err) => toast.show(err.message, 'error')).finally(() => setLoadingDoctor(false));
  }, [ready, session?.doctorId]);

  const tabs = [
    { id: 'queue', label: 'Today', te: 'ఈరోజు' },
    { id: 'scribe', label: 'AI Scribe', te: 'AI స్క్రైబ్' },
  ];

  if (!ready || loadingDoctor) return <CenterLoader label="Loading…" labelTe="లోడ్ అవుతోంది…" />;

  if (!doctor) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-500)' }}>
        <T en="Your account isn't linked to a doctor profile yet. Contact your hospital admin." te="మీ ఖాతా ఇంకా డాక్టర్ ప్రొఫైల్‌తో లింక్ చేయబడలేదు. మీ హాస్పిటల్ అడ్మిన్‌ని సంప్రదించండి." />
      </div>
    );
  }

  return (
    <>
      <TopBar roleLabel="Doctor" roleTe="డాక్టర్" title={doctor.name} initials={doctor.avatar_initials} />
      <SubNav tabs={tabs} active={tab} setActive={(id) => { setTab(id); setActiveAppt(null); }} />
      <div className="scroll-area">
        {tab === 'queue' && !activeAppt && <Queue doctor={doctor} toast={toast} onOpen={setActiveAppt} />}
        {tab === 'queue' && activeAppt && <Consultation appt={activeAppt} doctor={doctor} onBack={() => setActiveAppt(null)} toast={toast} />}
        {tab === 'scribe' && <AIScribe toast={toast} />}
      </div>
      {toast.node}
    </>
  );
}

function Queue({ doctor, toast, onOpen }) {
  const { lang } = useLang();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await api(`/appointments?doctor_id=${doctor.id}&date=${today}`);
      setAppts(data || []);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [doctor.id]);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable('appointments', load);

  const waiting = appts.filter((a) => a.status === 'confirmed' || a.status === 'waiting');
  const done = appts.filter((a) => a.status === 'completed');

  if (loading) return <CenterLoader label="Loading queue…" labelTe="క్యూ లోడ్ అవుతోంది…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 980 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 22 }}>
        <StatCard label="Today's Appointments" labelTe="ఈరోజు అపాయింట్‌మెంట్లు" value={appts.length} icon="calendar" />
        <StatCard label="Waiting Patients" labelTe="వేచి ఉన్న పేషెంట్లు" value={waiting.length} icon="users" />
        <StatCard label="Consultations Done" labelTe="పూర్తయిన సంప్రదింపులు" value={done.length} icon="check" />
      </div>

      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14.5 }}><T en="Patient Queue" te="పేషెంట్ క్యూ" /></h3>
          <span className="pill teal"><T en="Live" te="లైవ్" /></span>
        </div>
        {appts.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <div style={{ width: 64, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{a.appointment_time}</div>
            <div className="avatar" style={{ width: 40, height: 40, fontSize: 13 }}>{(a.patients?.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.patients?.name} <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>· {a.patients?.age}{a.patients?.gender}</span></div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{a.reason}</div>
            </div>
            <span className={`pill ${a.status === 'completed' ? 'green' : 'amber'}`}>{a.status}</span>
            {a.status !== 'completed' && (
              <button className="btn btn-primary btn-sm" onClick={() => onOpen(a)}><T en="Start Consult" te="ప్రారంభించండి" /></button>
            )}
          </div>
        ))}
        {appts.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}><T en="No appointments today." te="ఈరోజు అపాయింట్‌మెంట్లు లేవు." /></div>}
      </div>
    </div>
  );
}

function Consultation({ appt, doctor, onBack, toast }) {
  const { lang } = useLang();
  const [symptoms, setSymptoms] = useState(appt.reason || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicinesText, setMedicinesText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [redFlags, setRedFlags] = useState('');
  const [saving, setSaving] = useState(false);

  const runAI = async () => {
    if (!symptoms.trim()) return toast.show(t(lang, 'Enter symptoms first', 'ముందు లక్షణాలు నమోదు చేయండి'), 'error');
    setAiLoading(true);
    try {
      const result = await api('/ai/diagnose', {
        method: 'POST',
        body: { symptoms, patientAge: appt.patients?.age, patientGender: appt.patients?.gender },
      });
      setDiagnosis(result.likely_diagnosis || '');
      setMedicinesText(result.common_medicines || '');
      setRedFlags(result.red_flags || '');
      setAiDone(true);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const medicines = medicinesText
        ? medicinesText.split(',').map((m) => ({ name: m.trim() })).filter((m) => m.name)
        : [];
      await api('/consultations', {
        method: 'POST',
        body: {
          appointment_id: appt.id,
          patient_id: appt.patient_id,
          doctor_id: doctor.id,
          symptoms,
          diagnosis,
          notes: medicinesText,
          ai_generated: aiDone,
          medicines,
        },
      });
      toast.show(t(lang, 'Consultation saved', 'సంప్రదింపు సేవ్ చేయబడింది'));
      onBack();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 920 }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={onBack}><I.arrowLeft size={14} /> <T en="Back to queue" te="క్యూకి తిరిగి వెళ్ళండి" /></button>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 18, alignSelf: 'start' }}>
          <div className="avatar" style={{ width: 50, height: 50, marginBottom: 12 }}>{(appt.patients?.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{appt.patients?.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 16 }}>{appt.patients?.age} yrs · {appt.patients?.gender === 'M' ? t(lang, 'Male', 'పురుషుడు') : t(lang, 'Female', 'స్త్రీ')}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>UHID</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{appt.patients?.uhid}</div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <Field label="Symptoms" labelTe="లక్షణాలు">
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2} style={textareaStyle} />
          </Field>

          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button className="btn btn-sm" style={{ background: 'var(--accent-100)', color: 'var(--accent)' }} onClick={runAI} disabled={aiLoading}>
              {aiLoading ? <Spinner size={14} /> : <I.sparkle size={14} />}
              {aiLoading ? <T en="Asking AI…" te="AI అడుగుతోంది…" /> : <T en="Generate AI Suggestion" te="AI సూచన రూపొందించండి" />}
            </button>
          </div>

          <Field label="Diagnosis" labelTe="రోగనిర్ధారణ">
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} style={textareaStyle} placeholder={t(lang, 'Enter diagnosis or generate with AI…', 'రోగనిర్ధారణ నమోదు చేయండి లేదా AI తో రూపొందించండి…')} />
          </Field>

          <Field label="Prescription / Medicines" labelTe="ప్రిస్క్రిప్షన్ / మందులు">
            <textarea value={medicinesText} onChange={(e) => setMedicinesText(e.target.value)} rows={3} style={textareaStyle} placeholder={t(lang, 'Medicine, dosage, duration — comma separated', 'మందు, మోతాదు, వ్యవధి — కామాతో వేరు చేయండి')} />
          </Field>

          {redFlags && (
            <div style={{ background: 'var(--red-100)', border: '1px solid var(--red-500)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--red-500)', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <I.alert size={15} style={{ flexShrink: 0, marginTop: 1 }} /> <span><strong><T en="AI flagged: " te="AI హెచ్చరిక: " /></strong>{redFlags}</span>
            </div>
          )}

          {aiDone && (
            <div style={{ background: 'var(--teal-100)', border: '1px solid var(--teal-400)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--teal-700)', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
              <I.shieldCheck size={15} /> <T en="AI suggestion generated by Groq. Please review before saving." te="AI సూచన Groq ద్వారా రూపొందించబడింది. సేవ్ చేయడానికి ముందు సమీక్షించండి." />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onBack}><T en="Cancel" te="రద్దు చేయండి" /></button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner size={14} /> : null}
              <T en="Save & Complete" te="సేవ్ చేసి పూర్తి చేయండి" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, labelTe, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}><T en={label} te={labelTe} /></div>
      {children}
    </div>
  );
}
const textareaStyle = { width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 13.5, resize: 'vertical', fontFamily: 'inherit', color: 'var(--ink-900)' };

function AIScribe({ toast }) {
  const { lang } = useLang();
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);

  // Uses the Web Speech API where available (Chrome/Edge desktop) for real
  // voice-to-text. Falls back to typed input everywhere else, including
  // most mobile browsers and Safari where SpeechRecognition isn't supported.
  const startListening = () => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      toast.show(t(lang, 'Voice input not supported in this browser — please type instead.', 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ లేదు — దయచేసి టైప్ చేయండి.'), 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      setTranscript((prev) => (prev ? prev + ' ' : '') + text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  const generate = async () => {
    if (!transcript.trim()) return toast.show(t(lang, 'Record or type a transcript first', 'ముందు రికార్డ్ చేయండి లేదా టైప్ చేయండి'), 'error');
    setLoading(true);
    setResult(null);
    try {
      const data = await api('/ai/scribe', { method: 'POST', body: { transcript } });
      setResult(data);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <button onClick={startListening} disabled={listening} style={{
            width: 84, height: 84, borderRadius: '50%', margin: '0 auto 18px',
            background: listening ? 'var(--red-500)' : 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: listening ? '0 0 0 8px var(--red-100)' : 'none', transition: 'box-shadow .3s',
          }}>
            <I.mic size={34} />
          </button>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {listening ? <T en="Listening…" te="వింటోంది…" /> : <T en="Tap to dictate, or type below" te="చెప్పడానికి నొక్కండి, లేదా క్రింద టైప్ చేయండి" />}
          </div>
        </div>

        <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={4}
          placeholder={t(lang, 'e.g. Patient has fever for 3 days with mild cough, no breathing difficulty…', 'ఉదా: పేషెంట్‌కు 3 రోజులుగా జ్వరం, తేలికపాటి దగ్గు ఉంది…')}
          style={textareaStyle} />

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={generate} disabled={loading}>
          {loading ? <Spinner size={15} /> : <I.sparkle size={15} />}
          {loading ? <T en="Generating with AI…" te="AI తో రూపొందిస్తోంది…" /> : <T en="Generate Structured Note" te="నిర్మాణాత్మక గమనిక రూపొందించండి" />}
        </button>
      </div>

      {result && (
        <div className="card fade-in" style={{ padding: 18, marginTop: 16, borderColor: 'var(--teal-400)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <I.sparkle size={16} style={{ color: 'var(--teal-600)' }} />
            <span style={{ fontWeight: 700, fontSize: 13.5 }}><T en="AI Generated (Groq)" te="AI రూపొందించింది (Groq)" /></span>
          </div>
          <div className="grid" style={{ gap: 10 }}>
            <ScribeRow label="Symptoms" labelTe="లక్షణాలు" value={result.symptoms} />
            <ScribeRow label="Diagnosis" labelTe="రోగనిర్ధారణ" value={result.diagnosis} />
            <ScribeRow label="Suggested Medicines" labelTe="సూచించిన మందులు" value={result.suggested_medicines} />
            {result.lab_recommendations && <ScribeRow label="Lab Recommendations" labelTe="ల్యాబ్ సిఫార్సులు" value={result.lab_recommendations} />}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 14, lineHeight: 1.5 }}>{t(lang, result.disclaimer_en, result.disclaimer_te)}</div>
        </div>
      )}
    </div>
  );
}

function ScribeRow({ label, labelTe, value }) {
  return (
    <div style={{ display: 'flex', padding: '10px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ width: 170, fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', flexShrink: 0 }}><T en={label} te={labelTe} /></div>
      <div style={{ fontSize: 13, color: 'var(--ink-900)' }}>{value}</div>
    </div>
  );
}
