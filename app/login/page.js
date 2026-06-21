'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { I } from '@/components/icons';
import { T, useLang } from '@/components/LangContext';
import { useSession } from '@/components/SessionContext';
import { ROLES } from '@/components/Shell';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const { session, setSession, loaded } = useSession();
  const [step, setStep] = useState('phone'); // phone -> otp -> role -> patientPick
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (loaded && session) {
      const r = ROLES.find((r) => r.id === session.role);
      if (r) router.replace(r.path);
    }
  }, [loaded, session]);

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setStep('role');
  };

  const pickRole = async (r) => {
    setRole(r);
    if (r.id === 'patient') {
      setLoadingPatients(true);
      try {
        const data = await api('/patients');
        setPatients(data || []);
      } catch {
        setPatients([]);
      }
      setLoadingPatients(false);
      setStep('patientPick');
    } else {
      setSession({ role: r.id, label: r.label });
      router.push(r.path);
    }
  };

  const pickPatient = (p) => {
    setSession({ role: 'patient', label: 'Patient', patientId: p.id, patientName: p.name });
    router.push('/patient');
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Image src="/logo.png" alt="MediFlow" width={64} height={64} style={{ objectFit: 'contain' }} />
        </div>

        {step === 'phone' && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('otp'); }}>
            <h2 style={{ fontSize: 19, textAlign: 'center', marginBottom: 4 }}><T en="Welcome Back" te="నమస్కారం" /></h2>
            <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginBottom: 22 }}>
              <T en="Sign in to MediFlow" te="MediFlow లోకి సైన్ ఇన్ చేయండి" />
            </p>
            <Field label="Mobile Number" labelTe="మొబైల్ నంబర్">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="98765 43210" style={inputStyle} />
            </Field>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 8 }}>
              <T en="Send OTP" te="OTP పంపండి" />
            </button>
            <LangToggle lang={lang} setLang={setLang} />
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit}>
            <h2 style={{ fontSize: 19, textAlign: 'center', marginBottom: 4 }}><T en="Enter OTP" te="OTP నమోదు చేయండి" /></h2>
            <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginBottom: 22 }}>
              <T en={`Sent to ${phone || 'your number'} (demo: any 4 digits)`} te={`${phone || 'మీ నంబర్'} కు పంపబడింది (డెమో: ఏదైనా 4 అంకెలు)`} />
            </p>
            <Field label="OTP" labelTe="OTP">
              <input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={4} placeholder="••••" style={{ ...inputStyle, letterSpacing: 6, textAlign: 'center' }} />
            </Field>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 8 }}>
              <T en="Login" te="లాగిన్" />
            </button>
            <LangToggle lang={lang} setLang={setLang} />
          </form>
        )}

        {step === 'role' && (
          <div>
            <h2 style={{ fontSize: 19, textAlign: 'center', marginBottom: 4 }}><T en="Select Role" te="పాత్రను ఎంచుకోండి" /></h2>
            <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center' }}>
              <T en="This is a demo — pick any role to explore" te="ఇది డెమో — అన్వేషించడానికి ఏదైనా పాత్రను ఎంచుకోండి" />
            </p>
            <div className="role-pick">
              {ROLES.map((r) => {
                const Icon = I[r.icon];
                return (
                  <button key={r.id} type="button" onClick={() => pickRole(r)}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-100)', color: 'var(--blue-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}><T en={r.label} te={r.te} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'patientPick' && (
          <div>
            <button onClick={() => setStep('role')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 14, fontWeight: 600 }}>
              <I.arrowLeft size={14} /> <T en="Back" te="వెనుకకు" />
            </button>
            <h2 style={{ fontSize: 17, marginBottom: 14 }}><T en="Choose patient profile" te="పేషెంట్ ప్రొఫైల్ ఎంచుకోండి" /></h2>
            <p style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 14 }}>
              <T en="Demo only: pick which seeded patient to act as." te="డెమో మాత్రమే: ఏ పేషెంట్‌గా వ్యవహరించాలో ఎంచుకోండి." />
            </p>
            {loadingPatients && <div style={{ fontSize: 13, color: 'var(--ink-500)' }}><T en="Loading…" te="లోడ్ అవుతోంది…" /></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {patients.map((p) => (
                <button key={p.id} onClick={() => pickPatient(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', textAlign: 'left' }}>
                  <span>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{p.uhid}</div>
                  </span>
                  <I.chevronRight size={16} style={{ color: 'var(--ink-300)' }} />
                </button>
              ))}
              {!loadingPatients && patients.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
                  <T en="No patients found — make sure your Supabase schema.sql has been run." te="పేషెంట్లు కనుగొనబడలేదు — schema.sql రన్ చేశారని నిర్ధారించుకోండి." />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, labelTe, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}><T en={label} te={labelTe} /></div>
      {children}
    </div>
  );
}

function LangToggle({ lang, setLang }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
      <button type="button" onClick={() => setLang('en')} style={{ fontSize: 12.5, fontWeight: 700, color: lang === 'en' ? 'var(--blue-900)' : 'var(--ink-300)' }}>English</button>
      <span style={{ color: 'var(--line)' }}>|</span>
      <button type="button" onClick={() => setLang('te')} style={{ fontSize: 12.5, fontWeight: 700, color: lang === 'te' ? 'var(--blue-900)' : 'var(--ink-300)' }} className="te">తెలుగు</button>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14 };
