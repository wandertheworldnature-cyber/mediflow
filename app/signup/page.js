'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { T, t, useLang } from '@/components/LangContext';
import { useAuth } from '@/components/AuthContext';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { I } from '@/components/icons';

const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14 };

export default function SignupPage() {
  const router = useRouter();
  const { lang } = useLang();
  const { refreshProfile } = useAuth();
  const [path, setPath] = useState(null); // 'hospital' | 'staff' | 'patient'
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    hospitalName: '', city: '', state: '',
    hospitalId: '', role: 'doctor', speciality: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const doSignup = async (mode) => {
    setError('');
    setSubmitting(true);
    try {
      const body = {
        mode,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      };
      if (mode === 'new_hospital') {
        body.hospitalName = form.hospitalName;
        body.city = form.city;
        body.state = form.state;
      } else {
        body.hospitalId = form.hospitalId;
        // path === 'patient' always signs up as patient regardless of the
        // role dropdown (which is only shown on the staff path). Without
        // this override, the form.role default of 'doctor' leaks through.
        body.role = path === 'patient' ? 'patient' : form.role;
        if (body.role === 'doctor') body.speciality = form.speciality;
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Signup failed.');

      // Account created — now sign them in for real.
      const sb = supabaseBrowser();
      const { error: signInError } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
      if (signInError) throw signInError;

      await refreshProfile();
      const role = json.data.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'doctor') router.push('/doctor');
      else if (role === 'nurse') router.push('/nurse');
      else router.push('/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Image src="/logo.png" alt="MediFlow" width={56} height={56} style={{ objectFit: 'contain' }} />
        </div>

        {!path && (
          <>
            <h2 style={{ fontSize: 19, textAlign: 'center', marginBottom: 4 }}><T en="Create an Account" te="ఖాతా సృష్టించండి" /></h2>
            <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginBottom: 22 }}>
              <T en="How will you be using MediFlow?" te="మీరు MediFlow ఎలా ఉపయోగిస్తారు?" />
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PathButton icon="building" label="I'm setting up a new hospital" labelTe="నేను కొత్త ఆసుపత్రిని సెటప్ చేస్తున్నాను" sub="Creates your hospital + Admin account" subTe="మీ ఆసుపత్రి + అడ్మిన్ ఖాతాను సృష్టిస్తుంది" onClick={() => setPath('hospital')} />
              <PathButton icon="stethoscope" label="I'm joining as staff" labelTe="నేను సిబ్బందిగా చేరుతున్నాను" sub="Doctor or Nurse — needs a hospital code" subTe="డాక్టర్ లేదా నర్స్ — హాస్పిటల్ కోడ్ అవసరం" onClick={() => setPath('staff')} />
              <PathButton icon="heart" label="I'm a patient" labelTe="నేను పేషెంట్‌ని" sub="Needs a hospital code from your clinic" subTe="మీ క్లినిక్ నుండి హాస్పిటల్ కోడ్ అవసరం" onClick={() => setPath('patient')} />
            </div>
          </>
        )}

        {path === 'hospital' && (
          <form onSubmit={(e) => { e.preventDefault(); doSignup('new_hospital'); }}>
            <BackButton onClick={() => setPath(null)} />
            <h3 style={{ fontSize: 16, marginBottom: 14 }}><T en="Set up your hospital" te="మీ ఆసుపత్రిని సెటప్ చేయండి" /></h3>
            <Field label="Hospital Name" labelTe="ఆసుపత్రి పేరు"><input required value={form.hospitalName} onChange={(e) => set('hospitalName', e.target.value)} style={inputStyle} /></Field>
            <div style={{ display: 'flex', gap: 10 }}>
              <Field label="City" labelTe="నగరం"><input value={form.city} onChange={(e) => set('city', e.target.value)} style={inputStyle} /></Field>
              <Field label="State" labelTe="రాష్ట్రం"><input value={form.state} onChange={(e) => set('state', e.target.value)} style={inputStyle} /></Field>
            </div>
            <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 10 }}><T en="Your Admin Account" te="మీ అడ్మిన్ ఖాతా" /></div>
            <Field label="Full Name" labelTe="పూర్తి పేరు"><input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Email" labelTe="ఇమెయిల్"><input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} /></Field>
            <Field label="Phone" labelTe="ఫోన్"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} /></Field>
            <Field label="Password" labelTe="పాస్‌వర్డ్"><input type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} style={inputStyle} /></Field>
            <ErrorBox error={error} />
            <SubmitButton submitting={submitting} label="Create Hospital & Account" labelTe="ఆసుపత్రి & ఖాతా సృష్టించండి" />
          </form>
        )}

        {(path === 'staff' || path === 'patient') && (
          <form onSubmit={(e) => { e.preventDefault(); doSignup('join_hospital'); }}>
            <BackButton onClick={() => setPath(null)} />
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>{path === 'staff' ? <T en="Join as Staff" te="సిబ్బందిగా చేరండి" /> : <T en="Join as Patient" te="పేషెంట్‌గా చేరండి" />}</h3>

            <Field label="Hospital Code" labelTe="హాస్పిటల్ కోడ్">
              <input required value={form.hospitalId} onChange={(e) => set('hospitalId', e.target.value)} placeholder={t(lang, 'Ask your hospital admin for this', 'దీని కోసం మీ హాస్పిటల్ అడ్మిన్‌ని అడగండి')} style={inputStyle} />
            </Field>

            {path === 'staff' && (
              <>
                <Field label="Role" labelTe="పాత్ర">
                  <select value={form.role} onChange={(e) => set('role', e.target.value)} style={inputStyle}>
                    <option value="doctor">{t(lang, 'Doctor', 'డాక్టర్')}</option>
                    <option value="nurse">{t(lang, 'Nurse', 'నర్స్')}</option>
                  </select>
                </Field>
                {form.role === 'doctor' && (
                  <Field label="Speciality" labelTe="స్పెషాలిటీ"><input value={form.speciality} onChange={(e) => set('speciality', e.target.value)} placeholder="e.g. Cardiology" style={inputStyle} /></Field>
                )}
              </>
            )}

            <Field label="Full Name" labelTe="పూర్తి పేరు"><input required value={form.fullName} onChange={(e) => set('fullName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Email" labelTe="ఇమెయిల్"><input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} style={inputStyle} /></Field>
            <Field label="Phone" labelTe="ఫోన్"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} style={inputStyle} /></Field>
            <Field label="Password" labelTe="పాస్‌వర్డ్"><input type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} style={inputStyle} /></Field>
            <ErrorBox error={error} />
            <SubmitButton submitting={submitting} label="Create Account" labelTe="ఖాతా సృష్టించండి" />
          </form>
        )}

        <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginTop: 16 }}>
          <T en="Already have an account?" te="ఇప్పటికే ఖాతా ఉందా?" />{' '}
          <Link href="/login" style={{ color: 'var(--blue-900)', fontWeight: 700 }}><T en="Sign in" te="సైన్ ఇన్" /></Link>
        </p>
      </div>
    </div>
  );
}

function PathButton({ icon, label, labelTe, sub, subTe, onClick }) {
  const Icon = I[icon];
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--line)', textAlign: 'left' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--blue-100)', color: 'var(--blue-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={19} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}><T en={label} te={labelTe} /></div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}><T en={sub} te={subTe} /></div>
      </div>
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 14, fontWeight: 600 }}>
      <I.arrowLeft size={14} /> <T en="Back" te="వెనుకకు" />
    </button>
  );
}

function Field({ label, labelTe, children }) {
  return (
    <div style={{ marginBottom: 14, flex: 1 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}><T en={label} te={labelTe} /></div>
      {children}
    </div>
  );
}

function ErrorBox({ error }) {
  if (!error) return null;
  return <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, marginBottom: 14 }}>{error}</div>;
}

function SubmitButton({ submitting, label, labelTe }) {
  return (
    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 4 }} disabled={submitting}>
      {submitting ? <T en="Creating account…" te="ఖాతా సృష్టిస్తోంది…" /> : <T en={label} te={labelTe} />}
    </button>
  );
}
