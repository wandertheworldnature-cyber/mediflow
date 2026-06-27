'use client';
import { useState, useEffect, useCallback } from 'react';
import { TopBar, SubNav, CenterLoader, Spinner } from '@/components/Shell';
import { T, t, useLang } from '@/components/LangContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useToast } from '@/hooks/useToast';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { api } from '@/lib/api';
import { I } from '@/components/icons';
import { HealthRecords, FamilyVault, HealthCard } from './PatientPanels';
import { AIAssistantWidget } from './AIAssistant';

const SPECIALITIES = [
  { name: 'Cardiology', te: 'గుండె', icon: 'heart' },
  { name: 'Neurology', te: 'నాడీ వ్యవస్థ', icon: 'brain' },
  { name: 'Pediatrics', te: 'పిల్లల వైద్యం', icon: 'baby' },
  { name: 'Orthopedics', te: 'ఎముకలు', icon: 'bone' },
  { name: 'Dental', te: 'దంత వైద్యం', icon: 'tooth' },
];

export default function PatientPage() {
  const { ready, session } = useRequireRole('patient');
  const toast = useToast();
  const [tab, setTab] = useState('home');
  const [patient, setPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const loadPatient = useCallback(async () => {
    if (!session?.patientId) return;
    try {
      const data = await api(`/patients/${session.patientId}`);
      setPatient(data);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoadingPatient(false);
    }
  }, [session?.patientId]);

  useEffect(() => { if (ready) loadPatient(); }, [ready, loadPatient]);
  useRealtimeTable('appointments', loadPatient);
  useRealtimeTable('health_records', loadPatient);

  const tabs = [
    { id: 'home', label: 'Home', te: 'హోమ్' },
    { id: 'book', label: 'Book Doctor', te: 'డాక్టర్ బుక్ చేయండి' },
    { id: 'records', label: 'Health Records', te: 'ఆరోగ్య రికార్డులు' },
    { id: 'family', label: 'Family Vault', te: 'కుటుంబ ఆరోగ్యం' },
    { id: 'card', label: 'Health Card', te: 'హెల్త్ కార్డ్' },
    { id: 'ai', label: 'AI Assistant', te: 'AI సహాయకుడు' },
  ];

  if (!ready || loadingPatient || !patient) return <CenterLoader label="Loading your profile…" labelTe="మీ ప్రొఫైల్ లోడ్ అవుతోంది…" />;

  return (
    <>
      <TopBar roleLabel="Patient" roleTe="పేషెంట్" title={`Hello, ${patient.name.split(' ')[0]}`} titleTe={`నమస్కారం, ${patient.name.split(' ')[0]}`} initials={patient.name[0]} />
      <SubNav tabs={tabs} active={tab} setActive={setTab} />
      <div className="scroll-area">
        {tab === 'home' && <PatientHome patient={patient} toast={toast} goTo={setTab} onChanged={loadPatient} />}
        {tab === 'book' && <BookDoctor patient={patient} toast={toast} onChanged={loadPatient} />}
        {tab === 'records' && <HealthRecords patient={patient} />}
        {tab === 'family' && <FamilyVault patient={patient} toast={toast} onChanged={loadPatient} />}
        {tab === 'card' && <HealthCard patient={patient} />}
        {tab === 'ai' && <AIAssistantWidget patient={patient} />}
      </div>
      {toast.node}
    </>
  );
}

function QuickAction({ icon, label, labelTe, onClick, danger }) {
  const Icon = I[icon];
  return (
    <button onClick={onClick} className="card fade-in" style={{
      padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      background: danger ? 'var(--red-500)' : 'var(--white)',
      borderColor: danger ? 'var(--red-500)' : 'var(--line)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: danger ? 'rgba(255,255,255,0.18)' : 'var(--accent-100)',
        color: danger ? '#fff' : 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={21} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: danger ? '#fff' : 'var(--ink-700)', textAlign: 'center' }}>
        <T en={label} te={labelTe} />
      </span>
    </button>
  );
}

function PatientHome({ patient, toast, goTo, onChanged }) {
  const { lang } = useLang();
  const [sosOpen, setSosOpen] = useState(false);
  const upcoming = (patient.appointments || []).filter((a) => a.status !== 'completed' && a.status !== 'cancelled').slice(0, 3);
  return (
    <div className="fade-in" style={{ maxWidth: 880 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 22 }}>
        <QuickAction icon="stethoscope" label="Book Doctor" labelTe="డాక్టర్ బుక్ చేయండి" onClick={() => goTo('book')} />
        <QuickAction icon="file" label="Reports" labelTe="రిపోర్టులు" onClick={() => goTo('records')} />
        <QuickAction icon="sparkle" label="AI Assistant" labelTe="AI సహాయకుడు" onClick={() => goTo('ai')} />
        <QuickAction icon="card" label="Health Card" labelTe="హెల్త్ కార్డ్" onClick={() => goTo('card')} />
        <QuickAction icon="calendar" label="Appointments" labelTe="అపాయింట్‌మెంట్లు" onClick={() => goTo('book')} />
        <QuickAction icon="alert" label="Emergency SOS" labelTe="ఎమర్జెన్సీ SOS" danger onClick={() => setSosOpen(true)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15 }}><T en="Upcoming Appointments" te="రాబోయే అపాయింట్‌మెంట్లు" /></h3>
            <button className="btn btn-ghost btn-sm" onClick={() => goTo('book')}><T en="Book new" te="కొత్తది బుక్ చేయండి" /></button>
          </div>
          {upcoming.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: '1px solid var(--line)' }}>
              <div className="avatar" style={{ width: 42, height: 42, fontSize: 12.5 }}>{(a.doctors?.name || '?').split(' ').map((w) => w[0]).slice(1).join('')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.doctors?.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>{a.doctors?.speciality}</div>
                {a.status === 'pending' && <span className="pill amber" style={{ marginTop: 4 }}><T en="⏳ Awaiting confirmation" te="⏳ నిర్ధారణ కోసం వేచి ఉంది" /></span>}
                {a.status === 'confirmed' && <span className="pill green" style={{ marginTop: 4 }}><T en="✓ Confirmed" te="✓ నిర్ధారించబడింది" /></span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--accent)' }}>{a.appointment_date}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{a.appointment_time}</div>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}><T en="No upcoming appointments." te="రాబోయే అపాయింట్‌మెంట్లు లేవు." /></div>}
        </div>

        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, var(--blue-900), var(--teal-700))', color: '#fff', border: 'none' }}>
          <I.sparkle size={20} />
          <h3 style={{ fontSize: 15, marginTop: 10, marginBottom: 8 }}><T en="Ask AI Health Assistant" te="AI ఆరోగ్య సహాయకుడిని అడగండి" /></h3>
          <p style={{ fontSize: 12.5, opacity: 0.85, lineHeight: 1.5, marginBottom: 14 }}>
            <T en="Ask in English or Telugu — “What does my report mean?”" te="“నా రిపోర్ట్ అర్థం ఏమిటి?” — ఇంగ్లీష్ లేదా తెలుగులో అడగండి" />
          </p>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }} onClick={() => goTo('ai')}>
            <I.chat size={14} /> <T en="Ask now" te="ఇప్పుడు అడగండి" />
          </button>
        </div>
      </div>

      {sosOpen && <SOSModal onClose={() => setSosOpen(false)} toast={toast} />}
    </div>
  );
}

function SOSModal({ onClose, toast }) {
  const { lang } = useLang();
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} className="card fade-in" style={{ width: 380, padding: 26, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--red-100)', color: 'var(--red-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <I.alert size={30} />
        </div>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}><T en="Emergency SOS" te="ఎమర్జెన్సీ SOS" /></h3>
        <p style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 18 }}>
          <T en="This will share your live location and health card with the nearest hospital and your emergency contact." te="మీ లైవ్ లొకేషన్ మరియు హెల్త్ కార్డ్ సమీప ఆసుపత్రికి మరియు మీ ఎమర్జెన్సీ కాంటాక్ట్‌కి పంపబడుతుంది." />
        </p>
        <button className="btn" style={{ background: 'var(--red-500)', color: '#fff', width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginBottom: 10 }}
          onClick={() => { toast.show(t(lang, 'SOS sent — help is on the way', 'SOS పంపబడింది — సహాయం వస్తోంది')); onClose(); }}>
          <I.alert size={18} /> <T en="Send SOS Now" te="ఇప్పుడే SOS పంపండి" />
        </button>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}><T en="Cancel" te="రద్దు చేయండి" /></button>
      </div>
    </div>
  );
}

function BookDoctor({ patient, toast, onChanged }) {
  const { lang } = useLang();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);

  useEffect(() => { api('/doctors').then((d) => setDoctors(d || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = doctors.filter((d) => (d.name + d.speciality).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fade-in" style={{ maxWidth: 880 }}>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <I.search size={17} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--ink-300)' }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(lang, 'Search doctor or speciality…', 'డాక్టర్ లేదా స్పెషాలిటీ వెతకండి…')}
          style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12, border: '1px solid var(--line)', fontSize: 14, background: '#fff' }} />
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--ink-700)' }}><T en="Specialities" te="స్పెషాలిటీలు" /></h3>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {SPECIALITIES.map((s) => {
          const Icon = I[s.icon];
          return (
            <button key={s.name} onClick={() => setQuery(s.name)} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink-700)' }}>
              <Icon size={16} style={{ color: 'var(--accent)' }} />
              <T en={s.name} te={s.te} />
            </button>
          );
        })}
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--ink-700)' }}><T en="Available Doctors" te="అందుబాటులో ఉన్న డాక్టర్లు" /></h3>
      {loading ? <CenterLoader label="Loading doctors…" labelTe="లోడ్ అవుతోంది…" /> : (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {filtered.map((d) => (
            <div key={d.id} className="card" style={{ padding: 18, display: 'flex', gap: 14 }}>
              <div className="avatar" style={{ width: 50, height: 50, fontSize: 15, background: d.color, flexShrink: 0 }}>{d.avatar_initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{d.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 6 }}><T en={d.speciality} te={d.speciality_te} /> · {d.experience_years} <T en="yrs exp" te="సంవత్సరాల అనుభవం" /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span className="pill green">⭐ {d.rating}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>₹{d.fee}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => setPicked(d)}><T en="Book" te="బుక్ చేయండి" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {picked && <BookingModal doctor={picked} patient={patient} onClose={() => setPicked(null)} toast={toast} onChanged={onChanged} />}
    </div>
  );
}

function BookingModal({ doctor, patient, onClose, toast, onChanged }) {
  const { lang } = useLang();
  const slots = ['10:30 AM', '11:15 AM', '2:00 PM', '4:00 PM', '5:30 PM'];
  const [slot, setSlot] = useState(slots[0]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      await api('/appointments', {
        method: 'POST',
        body: {
          patient_id: patient.id,
          doctor_id: doctor.id,
          appointment_time: slot,
          reason: reason || 'General consultation',
        },
      });
      toast.show(t(lang, `Request sent to ${doctor.name} at ${slot} — awaiting hospital confirmation`, `${slot} కు అభ్యర్థన పంపబడింది — ఆసుపత్రి నిర్ధారణ కోసం వేచి ఉంది`));
      onChanged();
      onClose();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} className="card fade-in" style={{ width: 420, padding: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div className="avatar" style={{ width: 46, height: 46, background: doctor.color }}>{doctor.avatar_initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{doctor.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}><T en={doctor.speciality} te={doctor.speciality_te} /></div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 8 }}><T en="Reason for visit" te="సందర్శన కారణం" /></div>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t(lang, 'e.g. Fever, follow-up…', 'ఉదా: జ్వరం, ఫాలో-అప్…')} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 13.5, marginBottom: 18 }} />
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 8 }}><T en="Choose a slot" te="స్లాట్ ఎంచుకోండి" /></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {slots.map((s) => (
            <button key={s} onClick={() => setSlot(s)} className="btn-sm" style={{
              padding: '8px 12px', borderRadius: 9, fontWeight: 700, fontSize: 12.5,
              background: slot === s ? 'var(--accent)' : 'var(--bg)',
              color: slot === s ? '#fff' : 'var(--ink-700)',
              border: '1px solid ' + (slot === s ? 'var(--accent)' : 'var(--line)'),
            }}>{s}</button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }} onClick={confirm} disabled={saving}>
          {saving ? <Spinner size={15} /> : null}
          <T en="Confirm Booking" te="బుకింగ్ నిర్ధారించండి" />
        </button>
      </div>
    </div>
  );
}
