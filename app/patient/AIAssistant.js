'use client';
import { useState, useEffect, useRef } from 'react';
import { T, t, useLang } from '@/components/LangContext';
import { api } from '@/lib/api';
import { I } from '@/components/icons';
import { Spinner, CenterLoader } from '@/components/Shell';

export function AIAssistantWidget({ patient }) {
  const { lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api(`/ai/assistant?patient_id=${patient.id}`)
      .then((data) => setMessages(data || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [patient.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question, created_at: new Date().toISOString() }]);
    setLoading(true);
    try {
      const data = await api('/ai/assistant', { method: 'POST', body: { patient_id: patient.id, question, lang } });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, created_at: new Date().toISOString() }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: t(lang, 'Sorry, something went wrong. Please try again.', 'క్షమించండి, ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి.'), created_at: new Date().toISOString(), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    t(lang, 'What is diabetes?', 'మధుమేహం అంటే ఏమిటి?'),
    t(lang, 'When should I take my medicine?', 'నేను నా మందు ఎప్పుడు తీసుకోవాలి?'),
    t(lang, 'What does high BP mean?', 'అధిక రక్తపోటు అంటే ఏమిటి?'),
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 720, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-100)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.sparkle size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}><T en="MediFlow AI Health Assistant" te="MediFlow AI ఆరోగ్య సహాయకుడు" /></div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)' }}><T en="Powered by Groq · Not a substitute for medical advice" te="Groq ద్వారా ఆధారితం · వైద్య సలహాకు ప్రత్యామ్నాయం కాదు" /></div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
          {loadingHistory ? <CenterLoader label="Loading chat…" labelTe="చాట్ లోడ్ అవుతోంది…" /> : (
            <>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ink-500)' }}>
                  <I.sparkle size={26} style={{ marginBottom: 10, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, marginBottom: 16 }}><T en="Ask anything about your health in English or Telugu." te="మీ ఆరోగ్యం గురించి ఇంగ్లీష్ లేదా తెలుగులో ఏదైనా అడగండి." /></p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, margin: '0 auto' }}>
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => setInput(s)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    maxWidth: '78%', padding: '10px 14px', borderRadius: 14,
                    background: m.role === 'user' ? 'var(--accent)' : m.isError ? 'var(--red-100)' : 'var(--bg)',
                    color: m.role === 'user' ? '#fff' : m.isError ? 'var(--red-500)' : 'var(--ink-900)',
                    fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Spinner size={14} /> <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}><T en="Thinking…" te="ఆలోచిస్తోంది…" /></span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <form onSubmit={send} style={{ padding: 14, borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t(lang, 'Type your question…', 'మీ ప్రశ్న టైప్ చేయండి…')}
            style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 13.5 }} />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            <I.send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
