'use client';
import { useState, useEffect } from 'react';
import { T, t, useLang } from '@/components/LangContext';
import { api } from '@/lib/api';
import { I } from '@/components/icons';
import { CenterLoader, Spinner } from '@/components/Shell';

export function HealthRecords({ patient }) {
  const { lang } = useLang();
  const records = patient.health_records || [];

  return (
    <div className="fade-in card" style={{ maxWidth: 760, padding: 6 }}>
      {records.map((r, i) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-100)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <I.file size={17} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.record_type}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {r.doctors?.name ? `· ${r.doctors.name}` : ''}</div>
          </div>
          <span className={`pill ${r.status === 'Active' ? 'amber' : 'gray'}`}>{r.status}</span>
        </div>
      ))}
      {records.length === 0 && (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>
          <T en="No health records yet. They'll appear here after your first consultation." te="ఇంకా ఆరోగ్య రికార్డులు లేవు. మీ మొదటి సంప్రదింపు తర్వాత ఇక్కడ కనిపిస్తాయి." />
        </div>
      )}
    </div>
  );
}

export function FamilyVault({ patient, toast, onChanged }) {
  const { lang } = useLang();
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const family = patient.family || [];

  return (
    <div className="fade-in" style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        {family.map((f) => (
          <button key={f.id} onClick={() => setSel(f)} className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 120 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-100)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{f.member?.name?.[0]}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{f.member?.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{f.relation} · {f.member?.age}</div>
          </button>
        ))}
        <button className="card" onClick={() => setShowAdd(true)} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, width: 120, borderStyle: 'dashed', color: 'var(--ink-500)' }}>
          <I.plus size={22} />
          <span style={{ fontSize: 12, fontWeight: 700 }}><T en="Add Member" te="సభ్యుని చేర్చండి" /></span>
        </button>
      </div>

      {sel && (
        <div className="card fade-in" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{sel.member?.name}</div>
            <span style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>· {sel.relation}, <T en="Age" te="వయసు" /> {sel.member?.age}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
            <T en="Full record view for family members is part of a future release — for now this links the family relationship in the shared database." te="కుటుంబ సభ్యుల పూర్తి రికార్డ్ వీక్షణ భవిష్యత్ రిలీజ్‌లో భాగం — ప్రస్తుతానికి ఇది భాగస్వామ్య డేటాబేస్‌లో కుటుంబ సంబంధాన్ని లింక్ చేస్తుంది." />
          </div>
        </div>
      )}
      {!sel && family.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-500)', fontSize: 13 }}>
          <T en="Select a family member to view their profile." te="వారి ప్రొఫైల్ చూడటానికి కుటుంబ సభ్యుడిని ఎంచుకోండి." />
        </div>
      )}
      {family.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-500)', fontSize: 13 }}>
          <T en="No family members linked yet." te="ఇంకా కుటుంబ సభ్యులు లింక్ చేయబడలేదు." />
        </div>
      )}

      {showAdd && <AddFamilyModal patient={patient} onClose={() => setShowAdd(false)} toast={toast} onChanged={onChanged} />}
    </div>
  );
}

function AddFamilyModal({ patient, onClose, toast, onChanged }) {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', age: '', relation: 'Father' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create the family member as their own lightweight patient record
      // (so they're independently queryable by Admin/Doctor/etc.), then
      // link them to the logged-in patient via family_links so they show
      // up in this vault.
      const member = await api('/patients', { method: 'POST', body: { name: form.name, age: Number(form.age) || null, status: 'OPD' } });
      await api('/family-links', { method: 'POST', body: { patient_id: patient.id, member_patient_id: member.id, relation: form.relation } });
      toast.show(t(lang, `${form.name} added to your family vault`, `${form.name} మీ కుటుంబ వాల్ట్‌కు జోడించబడింది`));
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
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card fade-in" style={{ width: 360, padding: 22 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}><T en="Add Family Member" te="కుటుంబ సభ్యుని చేర్చండి" /></h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}><T en="Name" te="పేరు" /></div>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}><T en="Age" te="వయసు" /></div>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}><T en="Relation" te="సంబంధం" /></div>
            <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} style={inputStyle}>
              <option>Father</option><option>Mother</option><option>Spouse</option><option>Son</option><option>Daughter</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}><T en="Cancel" te="రద్దు చేయండి" /></button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
            {saving ? <Spinner size={14} /> : <T en="Add" te="చేర్చండి" />}
          </button>
        </div>
      </form>
    </div>
  );
}
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 13.5 };

export function HealthCard({ patient }) {
  const { lang } = useLang();
  return (
    <div className="fade-in" style={{ maxWidth: 420 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--blue-900), var(--teal-600))', color: '#fff', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.85 }}><T en="PATIENT HEALTH CARD" te="పేషెంట్ హెల్త్ కార్డ్" /></span>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2 }}>{patient.name}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 18 }}>UHID: {patient.uhid}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
            <div><div style={{ opacity: 0.7, marginBottom: 2 }}><T en="Blood Group" te="రక్త వర్గం" /></div><div style={{ fontWeight: 700, fontSize: 14 }}>{patient.blood_group || '—'}</div></div>
            <div><div style={{ opacity: 0.7, marginBottom: 2 }}><T en="Allergies" te="అలర్జీలు" /></div><div style={{ fontWeight: 700, fontSize: 14 }}>{patient.allergies || t(lang, 'None', 'లేదు')}</div></div>
            <div><div style={{ opacity: 0.7, marginBottom: 2 }}><T en="Chronic" te="దీర్ఘకాలిక" /></div><div style={{ fontWeight: 700, fontSize: 14 }}>{patient.chronic_conditions || t(lang, 'None', 'లేదు')}</div></div>
            <div><div style={{ opacity: 0.7, marginBottom: 2 }}><T en="Emergency" te="అత్యవసర" /></div><div style={{ fontWeight: 700, fontSize: 14 }}>{patient.emergency_contact || '—'}</div></div>
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 120, height: 120, borderRadius: 12, background: 'var(--ink-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <I.qr size={64} />
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--ink-500)', textAlign: 'center' }}>
            <T en="Show this QR at any hospital for instant emergency access." te="ఏదైనా ఆసుపత్రిలో తక్షణ అత్యవసర యాక్సెస్ కోసం ఈ QR చూపించండి." />
          </p>
        </div>
      </div>
    </div>
  );
}
