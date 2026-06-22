'use client';
import { useState, useEffect, useCallback } from 'react';
import { TopBar, SubNav, StatCard, CenterLoader } from '@/components/Shell';
import { T, t, useLang } from '@/components/LangContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useToast } from '@/hooks/useToast';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { api } from '@/lib/api';
import { I } from '@/components/icons';

export default function AdminPage() {
  const { ready, session } = useRequireRole('admin');
  const { lang } = useLang();
  const toast = useToast();
  const [tab, setTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', te: 'డాష్‌బోర్డ్' },
    { id: 'patients', label: 'Patients', te: 'పేషెంట్లు' },
    { id: 'appointments', label: 'Appointments', te: 'అపాయింట్‌మెంట్లు' },
    { id: 'billing', label: 'Billing', te: 'బిల్లింగ్' },
    { id: 'pharmacy', label: 'Pharmacy', te: 'ఫార్మసీ' },
    { id: 'analytics', label: 'AI Insights', te: 'AI అంతర్దృష్టులు' },
    { id: 'staff', label: 'Staff & Onboarding', te: 'సిబ్బంది & ఆన్‌బోర్డింగ్' },
  ];

  if (!ready) return <CenterLoader label="Loading…" labelTe="లోడ్ అవుతోంది…" />;

  return (
    <>
      <TopBar roleLabel="Hospital Admin" roleTe="హాస్పిటల్ అడ్మిన్" title={session?.hospitalName || ''} initials={session?.fullName?.[0] || 'A'} />
      <SubNav tabs={tabs} active={tab} setActive={setTab} />
      <div className="scroll-area">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'patients' && <Patients toast={toast} />}
        {tab === 'appointments' && <Appointments toast={toast} />}
        {tab === 'billing' && <Billing toast={toast} />}
        {tab === 'pharmacy' && <Pharmacy />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'staff' && <Staff session={session} toast={toast} />}
      </div>
      {toast.node}
    </>
  );
}

function MiniBarChart({ data, height = 80 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: 'var(--accent)', opacity: 0.15 + (v / max) * 0.85, borderRadius: '3px 3px 0 0', height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

function Dashboard() {
  const { lang } = useLang();
  const [wards, setWards] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ patients: 0, admissions: 0, discharges: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [wardData, doctorData, patientData] = await Promise.all([
        api('/wards'),
        api('/doctors'),
        api('/patients'),
      ]);
      setWards(wardData || []);
      setDoctors(doctorData || []);
      const admitted = (patientData || []).filter((p) => p.status === 'Admitted').length;
      const discharged = (patientData || []).filter((p) => p.status === 'Discharged').length;
      setStats({ patients: (patientData || []).length, admissions: admitted, discharges: discharged });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable('beds', load);
  useRealtimeTable('patients', load);

  const revenueTrend = [62, 68, 71, 65, 80, 76, 88, 91, 85, 96, 102, 98, 110, 118, 112, 125];

  if (loading) return <CenterLoader label="Loading dashboard…" labelTe="డాష్‌బోర్డ్ లోడ్ అవుతోంది…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 22 }}>
        <StatCard label="Today's Revenue" labelTe="ఈరోజు ఆదాయం" value="₹1,25,000" icon="rupee" sub="+8% vs yesterday" />
        <StatCard label="Total Patients" labelTe="మొత్తం పేషెంట్లు" value={stats.patients} icon="users" />
        <StatCard label="Admitted" labelTe="చేరికలు" value={stats.admissions} icon="bed" />
        <StatCard label="Discharged" labelTe="డిశ్చార్జీలు" value={stats.discharges} icon="check" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 14.5 }}><T en="Revenue — Last 16 Days" te="ఆదాయం — గత 16 రోజులు" /></h3>
            <span className="pill green">+18% <T en="growth" te="వృద్ధి" /></span>
          </div>
          <MiniBarChart data={revenueTrend} height={140} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, marginBottom: 16 }}><T en="Occupancy by Ward" te="వార్డ్ వారీగా ఆక్యుపెన్సీ" /></h3>
          {wards.map((w) => (
            <div key={w.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: 'var(--ink-700)' }}>{w.name}</span>
                <span style={{ color: 'var(--ink-500)' }}>{w.occupied}/{w.total_beds}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(w.occupied / w.total_beds) * 100}%`, background: 'var(--accent)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14.5, marginBottom: 16 }}><T en="Doctors" te="డాక్టర్లు" /></h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {doctors.map((d) => (
            <div key={d.id} style={{ textAlign: 'center' }}>
              <div className="avatar" style={{ width: 42, height: 42, margin: '0 auto 8px', background: d.color, fontSize: 13 }}>{d.avatar_initials}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{d.name.split(' ').slice(-1)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{d.speciality}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Patients({ toast }) {
  const { lang } = useLang();
  const [q, setQ] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api(`/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setPatients(data || []);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable('patients', load);

  const statusPill = (s) => (s === 'Admitted' ? 'blue' : s === 'OPD' ? 'teal' : 'gray');

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <I.search size={16} style={{ position: 'absolute', left: 13, top: 11, color: 'var(--ink-300)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, 'Search patient or UHID…', 'పేషెంట్ లేదా UHID వెతకండి…')}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 13.5 }} />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><I.plus size={15} /> <T en="Register Patient" te="పేషెంట్‌ని నమోదు చేయండి" /></button>
      </div>

      {loading ? <CenterLoader label="Loading patients…" labelTe="పేషెంట్లు లోడ్ అవుతున్నారు…" /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['UHID', 'Patient Name', 'Mobile', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h && <T en={h} te={h === 'Patient Name' ? 'పేషెంట్ పేరు' : h === 'Mobile' ? 'మొబైల్' : h === 'Status' ? 'స్థితి' : h} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent)' }}>{p.uhid}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--ink-500)' }}>{p.mobile || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`pill ${statusPill(p.status)}`}>{p.status}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => toast.show(t(lang, `Viewing ${p.name}`, `${p.name} చూస్తున్నారు`))}><I.eye size={15} /></button>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}><T en="No patients found." te="పేషెంట్లు కనుగొనబడలేదు." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); toast.show(t(lang, 'Patient registered', 'పేషెంట్ నమోదు చేయబడింది')); }} />}
    </div>
  );
}

function AddPatientModal({ onClose, onSaved }) {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', mobile: '', age: '', gender: 'M' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/patients', { method: 'POST', body: { ...form, age: form.age ? Number(form.age) : null } });
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card fade-in" style={{ width: 380, padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}><T en="Register New Patient" te="కొత్త పేషెంట్‌ని నమోదు చేయండి" /></h3>
        <FormField label="Full Name" labelTe="పూర్తి పేరు">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        </FormField>
        <FormField label="Mobile" labelTe="మొబైల్">
          <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} style={inputStyle} />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <FormField label="Age" labelTe="వయసు">
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Gender" labelTe="లింగం">
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={inputStyle}>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}><T en="Cancel" te="రద్దు చేయండి" /></button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
            {saving ? <T en="Saving…" te="సేవ్ అవుతోంది…" /> : <T en="Register" te="నమోదు చేయండి" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, labelTe, children }) {
  return (
    <div style={{ marginBottom: 14, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}><T en={label} te={labelTe} /></div>
      {children}
    </div>
  );
}
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 13.5 };

function Appointments({ toast }) {
  const { lang } = useLang();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await api(`/appointments?date=${today}`);
      setAppts(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable('appointments', load);

  const statusPill = (s) => (s === 'completed' ? 'green' : s === 'confirmed' || s === 'waiting' ? 'blue' : 'red');

  if (loading) return <CenterLoader label="Loading appointments…" labelTe="లోడ్ అవుతోంది…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowBook(true)}>
          <I.plus size={15} /> <T en="Book Appointment" te="అపాయింట్‌మెంట్ బుక్ చేయండి" />
        </button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
              {['Doctor', 'Patient', 'Time', 'Status'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <T en={h} te={h === 'Doctor' ? 'డాక్టర్' : h === 'Patient' ? 'పేషెంట్' : h === 'Time' ? 'సమయం' : 'స్థితి'} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appts.map((a) => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.doctors?.name}</td>
                <td style={{ padding: '12px 16px' }}>{a.patients?.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--ink-500)' }}>{a.appointment_time}</td>
                <td style={{ padding: '12px 16px' }}><span className={`pill ${statusPill(a.status)}`}>{a.status}</span></td>
              </tr>
            ))}
            {appts.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}><T en="No appointments today." te="ఈరోజు అపాయింట్‌మెంట్లు లేవు." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showBook && <BookAppointmentModal onClose={() => setShowBook(false)} onSaved={() => { setShowBook(false); load(); toast?.show?.(t(lang, 'Appointment booked', 'అపాయింట్‌మెంట్ బుక్ చేయబడింది')); }} />}
    </div>
  );
}

function BookAppointmentModal({ onClose, onSaved }) {
  const { lang } = useLang();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', appointment_time: '10:00 AM', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/patients'), api('/doctors')]).then(([p, d]) => {
      setPatients(p || []);
      setDoctors(d || []);
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id) { setError(t(lang, 'Select both patient and doctor.', 'పేషెంట్ మరియు డాక్టర్ ఎంచుకోండి.')); return; }
    setSaving(true); setError('');
    try {
      await api('/appointments', { method: 'POST', body: { patient_id: form.patient_id, doctor_id: form.doctor_id, appointment_time: form.appointment_time, reason: form.reason || 'Walk-in' } });
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const slots = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','2:00 PM','2:30 PM','3:00 PM','4:00 PM','5:00 PM'];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card fade-in" style={{ width: 420, padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}><T en="Book Appointment" te="అపాయింట్‌మెంట్ బుక్ చేయండి" /></h3>
        <FormField label="Patient" labelTe="పేషెంట్">
          <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} style={inputStyle}>
            <option value="">{t(lang, 'Select patient…', 'పేషెంట్‌ని ఎంచుకోండి…')}</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.uhid}</option>)}
          </select>
        </FormField>
        <FormField label="Doctor" labelTe="డాక్టర్">
          <select required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} style={inputStyle}>
            <option value="">{t(lang, 'Select doctor…', 'డాక్టర్‌ని ఎంచుకోండి…')}</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.speciality}</option>)}
          </select>
        </FormField>
        <FormField label="Time Slot" labelTe="సమయం">
          <select value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} style={inputStyle}>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Reason" labelTe="కారణం">
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t(lang, 'e.g. Fever, follow-up…', 'ఉదా: జ్వరం, ఫాలో-అప్…')} style={inputStyle} />
        </FormField>
        {error && <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}><T en="Cancel" te="రద్దు చేయండి" /></button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
            {saving ? <T en="Booking…" te="బుక్ చేస్తోంది…" /> : <T en="Book" te="బుక్ చేయండి" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function Billing({ toast }) {
  const { lang } = useLang();
  const [items, setItems] = useState({ consultation_fee: 600, lab_charges: 0, medicine_charges: 0, room_charges: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api('/patients').then(setPatients).catch(() => {}); }, []);

  const total = Object.values(items).reduce((s, v) => s + (Number(v) || 0), 0);

  const generateInvoice = () => {
    if (!selected) return toast.show(t(lang, 'Select a patient first', 'ముందు పేషెంట్‌ని ఎంచుకోండి'), 'error');
    toast.show(t(lang, 'Invoice generated', 'ఇన్వాయిస్ రూపొందించబడింది'));
  };
  const sendWhatsapp = () => {
    if (!selected) return toast.show(t(lang, 'Select a patient first', 'ముందు పేషెంట్‌ని ఎంచుకోండి'), 'error');
    toast.show(t(lang, 'Sent via WhatsApp', 'వాట్సాప్ ద్వారా పంపబడింది'));
  };

  return (
    <div className="fade-in" style={{ maxWidth: 480 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}><T en="Patient" te="పేషెంట్" /></div>
        <select value={selected?.id || ''} onChange={(e) => setSelected(patients.find((p) => p.id === e.target.value))} style={{ ...inputStyle, marginBottom: 18 }}>
          <option value="">{t(lang, 'Select patient…', 'పేషెంట్‌ని ఎంచుకోండి…')}</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.uhid}</option>)}
        </select>

        {[
          { key: 'consultation_fee', label: 'Consultation', labelTe: 'సంప్రదింపు' },
          { key: 'lab_charges', label: 'Lab Charges', labelTe: 'ల్యాబ్ ఛార్జీలు' },
          { key: 'medicine_charges', label: 'Medicine Charges', labelTe: 'మందుల ఛార్జీలు' },
          { key: 'room_charges', label: 'Room Charges', labelTe: 'రూమ్ ఛార్జీలు' },
        ].map((it, i) => (
          <div key={it.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 'none', fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-700)' }}><T en={it.label} te={it.labelTe} /></span>
            <input type="number" value={items[it.key]} onChange={(e) => setItems({ ...items, [it.key]: e.target.value })} style={{ width: 100, padding: '6px 8px', borderRadius: 7, border: '1px solid var(--line)', textAlign: 'right', fontSize: 13 }} />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '2px solid var(--ink-900)', marginTop: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}><T en="Total" te="మొత్తం" /></span>
          <span className="display" style={{ fontWeight: 800, fontSize: 19, color: 'var(--accent)' }}>₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={generateInvoice}><I.file size={14} /> <T en="Generate Invoice" te="ఇన్వాయిస్ రూపొందించండి" /></button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={sendWhatsapp}><T en="Send WhatsApp" te="వాట్సాప్ పంపండి" /></button>
        </div>
      </div>
    </div>
  );
}

function Pharmacy() {
  const { lang } = useLang();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/pharmacy').then(setStock).catch(() => {}).finally(() => setLoading(false)); }, []);

  const lowStock = stock.filter((m) => m.status === 'low').length;

  if (loading) return <CenterLoader label="Loading pharmacy…" labelTe="లోడ్ అవుతోంది…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      {lowStock > 0 && (
        <div style={{ background: 'var(--amber-100)', border: '1px solid #F0C36A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#A26200', marginBottom: 18, display: 'flex', gap: 9, alignItems: 'center' }}>
          <I.alert size={16} /> <T en={`Low Stock Alerts — ${lowStock} medicines need reordering.`} te={`తక్కువ స్టాక్ హెచ్చరికలు — ${lowStock} మందులు మళ్లీ ఆర్డర్ చేయాలి.`} />
        </div>
      )}
      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5 }}><T en="Medicine Inventory" te="మందుల ఇన్వెంటరీ" /></div>
        {stock.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <I.pill size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{m.medicine_name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}><T en="Expiry" te="గడువు" />: {m.expiry_date}</div>
            </div>
            <div style={{ textAlign: 'right', marginRight: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.quantity}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)' }}><T en="units" te="యూనిట్లు" /></div>
            </div>
            <span className={`pill ${m.status === 'low' ? 'amber' : 'green'}`}>{m.status === 'low' ? t(lang, 'Low', 'తక్కువ') : t(lang, 'OK', 'సరిపోతుంది')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Staff({ session, toast }) {
  const { lang } = useLang();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/doctors').then((d) => setDoctors(d || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const copyCode = () => {
    navigator.clipboard?.writeText(session?.hospitalId || '');
    toast.show(t(lang, 'Hospital code copied', 'హాస్పిటల్ కోడ్ కాపీ చేయబడింది'));
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}><T en="Hospital Join Code" te="హాస్పిటల్ జాయిన్ కోడ్" /></h3>
        <p style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 14, lineHeight: 1.5 }}>
          <T en="Share this code with doctors, nurses, or patients so they can join your hospital when they sign up." te="డాక్టర్లు, నర్సులు లేదా పేషెంట్లు సైన్ అప్ చేసేటప్పుడు మీ హాస్పిటల్‌లో చేరడానికి ఈ కోడ్‌ని పంచుకోండి." />
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input readOnly value={session?.hospitalId || ''} style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 12.5, fontFamily: 'monospace', color: 'var(--ink-700)' }} />
          <button className="btn btn-primary" onClick={copyCode}><T en="Copy" te="కాపీ" /></button>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5 }}><T en="Doctors" te="డాక్టర్లు" /></div>
        {loading ? <CenterLoader label="Loading…" labelTe="లోడ్ అవుతోంది…" /> : (
          <>
            {doctors.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 12, background: d.color }}>{d.avatar_initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{d.speciality}</div>
                </div>
              </div>
            ))}
            {doctors.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}><T en="No doctors have joined yet — share your hospital code above." te="ఇంకా డాక్టర్లు చేరలేదు — పైన మీ హాస్పిటల్ కోడ్‌ని పంచుకోండి." /></div>}
          </>
        )}
      </div>
    </div>
  );
}

function Analytics() {
  const { lang } = useLang();
  const diseaseTrends = [
    { name: 'Viral Fever', te: 'వైరల్ జ్వరం', pct: 34 },
    { name: 'Diabetes', te: 'మధుమేహం', pct: 22 },
    { name: 'Hypertension', te: 'రక్తపోటు', pct: 18 },
    { name: 'Dengue', te: 'డెంగ్యూ', pct: 11 },
    { name: 'Respiratory', te: 'శ్వాసకోశ', pct: 9 },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 18 }}>
        <StatCard label="OPD Growth" labelTe="OPD వృద్ధి" value="+12%" icon="trend" />
        <StatCard label="Revenue Growth" labelTe="ఆదాయ వృద్ధి" value="+18%" icon="rupee" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, marginBottom: 16 }}><T en="Most Common Diseases" te="అత్యంత సాధారణ వ్యాధులు" /></h3>
          {diseaseTrends.map((d) => (
            <div key={d.name} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}><T en={d.name} te={d.te} /></span>
                <span style={{ color: 'var(--ink-500)' }}>{d.pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.pct * 2.5}%`, background: 'var(--accent)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, var(--blue-900), var(--teal-700))', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <I.sparkle size={18} />
            <h3 style={{ fontSize: 14.5 }}><T en="AI Recommendations" te="AI సిఫార్సులు" /></h3>
          </div>
          {[
            { en: 'Increase staff for evening OPD — 23% higher footfall expected this week.', te: 'సాయంత్రం OPD కోసం సిబ్బందిని పెంచండి — ఈ వారం 23% ఎక్కువ రద్దీ అంచనా.' },
            { en: 'Viral fever cases rising in rural catchment — prepare camp outreach.', te: 'గ్రామీణ ప్రాంతంలో వైరల్ జ్వరం కేసులు పెరుగుతున్నాయి — క్యాంప్ సిద్ధం చేయండి.' },
            { en: 'Reorder Amoxicillin and Insulin within 5 days to avoid stockout.', te: 'స్టాక్ అయిపోకుండా 5 రోజుల్లో అమోక్సిసిలిన్, ఇన్సులిన్ ఆర్డర్ చేయండి.' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i ? '1px solid rgba(255,255,255,0.15)' : 'none', fontSize: 12.5, lineHeight: 1.5 }}>
              <span style={{ opacity: 0.6 }}>0{i + 1}</span>
              <span><T en={r.en} te={r.te} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
