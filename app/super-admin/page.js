'use client';
import { useState, useEffect, useCallback } from 'react';
import { TopBar, SubNav, StatCard, CenterLoader, Spinner } from '@/components/Shell';
import { T, t, useLang } from '@/components/LangContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { I } from '@/components/icons';

export default function SuperAdminPage() {
  const { ready, session } = useRequireRole('super_admin');
  const toast = useToast();
  const [tab, setTab] = useState('hospitals');

  const tabs = [
    { id: 'hospitals', label: 'Hospitals', te: 'ఆసుపత్రులు' },
  ];

  if (!ready) return <CenterLoader label="Loading…" labelTe="లోడ్ అవుతోంది…" />;

  return (
    <>
      <TopBar roleLabel="Super Admin" roleTe="సూపర్ అడ్మిన్" title={session?.fullName || 'MediFlow Platform'} initials={session?.fullName?.[0] || 'S'} />
      <SubNav tabs={tabs} active={tab} setActive={setTab} />
      <div className="scroll-area">
        {tab === 'hospitals' && <Hospitals toast={toast} />}
      </div>
      {toast.node}
    </>
  );
}

function Hospitals({ toast }) {
  const { lang } = useLang();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCode, setShowCode] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api('/hospitals');
      setHospitals(data || []);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (h) => {
    const newStatus = h.status === 'active' ? 'suspended' : 'active';
    try {
      await api(`/hospitals/${h.id}`, { method: 'PATCH', body: { status: newStatus } });
      toast.show(t(lang, `${h.name} ${newStatus === 'active' ? 'activated' : 'suspended'}`, `${h.name} ${newStatus === 'active' ? 'సక్రియం చేయబడింది' : 'సస్పెండ్ చేయబడింది'}`));
      load();
    } catch (err) {
      toast.show(err.message, 'error');
    }
  };

  const totalPatients = hospitals.reduce((s, h) => s + (h.patient_count || 0), 0);
  const activeCount = hospitals.filter((h) => h.status === 'active').length;

  if (loading) return <CenterLoader label="Loading hospitals…" labelTe="ఆసుపత్రులు లోడ్ అవుతున్నాయి…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 22 }}>
        <StatCard label="Total Hospitals" labelTe="మొత్తం ఆసుపత్రులు" value={hospitals.length} icon="building" />
        <StatCard label="Active" labelTe="యాక్టివ్" value={activeCount} icon="check" />
        <StatCard label="Total Patients (all hospitals)" labelTe="మొత్తం పేషెంట్లు" value={totalPatients} icon="users" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><I.plus size={15} /> <T en="Onboard Hospital" te="ఆసుపత్రిని ఆన్‌బోర్డ్ చేయండి" /></button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
              {['Hospital', 'Location', 'Plan', 'Doctors', 'Patients', 'Status', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700 }}>{h.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--ink-500)' }}>{[h.city, h.state].filter(Boolean).join(', ') || '—'}</td>
                <td style={{ padding: '12px 16px' }}><span className="pill blue" style={{ textTransform: 'capitalize' }}>{h.plan}</span></td>
                <td style={{ padding: '12px 16px' }}>{h.doctor_count}</td>
                <td style={{ padding: '12px 16px' }}>{h.patient_count}</td>
                <td style={{ padding: '12px 16px' }}><span className={`pill ${h.status === 'active' ? 'green' : 'red'}`}>{h.status}</span></td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowCode(h)}><T en="Join Code" te="కోడ్" /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(h)}>
                    {h.status === 'active' ? <T en="Suspend" te="సస్పెండ్" /> : <T en="Activate" te="సక్రియం" />}
                  </button>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: 'var(--ink-500)' }}><T en="No hospitals yet." te="ఇంకా ఆసుపత్రులు లేవు." /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddHospitalModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); toast.show(t(lang, 'Hospital onboarded', 'ఆసుపత్రి ఆన్‌బోర్డ్ చేయబడింది')); }} />}
      {showCode && <JoinCodeModal hospital={showCode} onClose={() => setShowCode(null)} toast={toast} />}
    </div>
  );
}

function AddHospitalModal({ onClose, onSaved }) {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', city: '', state: '', plan: 'trial' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/hospitals', { method: 'POST', body: form });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card fade-in" style={{ width: 400, padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}><T en="Onboard New Hospital" te="కొత్త ఆసుపత్రిని ఆన్‌బోర్డ్ చేయండి" /></h3>
        <FormField label="Hospital Name" labelTe="ఆసుపత్రి పేరు">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        </FormField>
        <div style={{ display: 'flex', gap: 10 }}>
          <FormField label="City" labelTe="నగరం"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} /></FormField>
          <FormField label="State" labelTe="రాష్ట్రం"><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={inputStyle} /></FormField>
        </div>
        <FormField label="Plan" labelTe="ప్లాన్">
          <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} style={inputStyle}>
            <option value="trial">Trial</option>
            <option value="clinic">Clinic</option>
            <option value="hospital">Hospital</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </FormField>
        {error && <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}><T en="Cancel" te="రద్దు చేయండి" /></button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
            {saving ? <Spinner size={14} /> : <T en="Create" te="సృష్టించండి" />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 12, lineHeight: 1.5 }}>
          <T en="This creates the hospital only. The hospital's own Admin should sign up separately via the 'I'm setting up a new hospital' option — use this only for hospitals you're onboarding manually on their behalf." te="ఇది ఆసుపత్రిని మాత్రమే సృష్టిస్తుంది. ఆసుపత్రి అడ్మిన్ ప్రత్యేకంగా సైన్ అప్ చేయాలి." />
        </p>
      </form>
    </div>
  );
}

function JoinCodeModal({ hospital, onClose, toast }) {
  const { lang } = useLang();
  const copy = () => {
    navigator.clipboard?.writeText(hospital.id);
    toast.show(t(lang, 'Join code copied', 'జాయిన్ కోడ్ కాపీ చేయబడింది'));
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} className="card fade-in" style={{ width: 400, padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 6 }}>{hospital.name}</h3>
        <p style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 14 }}><T en="Hospital join code" te="హాస్పిటల్ జాయిన్ కోడ్" /></p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input readOnly value={hospital.id} style={{ flex: 1, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 12.5, fontFamily: 'monospace' }} />
          <button className="btn btn-primary" onClick={copy}><T en="Copy" te="కాపీ" /></button>
        </div>
      </div>
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
