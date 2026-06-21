'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { T, useLang } from '@/components/LangContext';
import { useAuth } from '@/components/AuthContext';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { ROLES } from '@/components/Shell';

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const { user, loading, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'super_admin') router.replace('/super-admin');
      else {
        const r = ROLES.find((r) => r.id === user.role);
        if (r) router.replace(r.path);
      }
    }
  }, [loading, user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const sb = supabaseBrowser();
    if (!sb) {
      setError('App is not configured yet — missing Supabase environment variables.');
      setSubmitting(false);
      return;
    }
    const { error: signInError } = await sb.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : signInError.message);
      setSubmitting(false);
      return;
    }
    await refreshProfile();
    setSubmitting(false);
    // useEffect above handles the redirect once `user` updates
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Image src="/logo.png" alt="MediFlow" width={64} height={64} style={{ objectFit: 'contain' }} />
        </div>

        <h2 style={{ fontSize: 19, textAlign: 'center', marginBottom: 4 }}><T en="Welcome Back" te="నమస్కారం" /></h2>
        <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginBottom: 22 }}>
          <T en="Sign in to MediFlow" te="MediFlow లోకి సైన్ ఇన్ చేయండి" />
        </p>

        <form onSubmit={submit}>
          <Field label="Email" labelTe="ఇమెయిల్">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
          </Field>
          <Field label="Password" labelTe="పాస్‌వర్డ్">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
          </Field>

          {error && <div style={{ background: 'var(--red-100)', color: 'var(--red-500)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, marginBottom: 14 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 4 }} disabled={submitting}>
            {submitting ? <T en="Signing in…" te="సైన్ ఇన్ అవుతోంది…" /> : <T en="Sign In" te="సైన్ ఇన్" />}
          </button>
        </form>

        <p style={{ fontSize: 12.5, color: 'var(--ink-500)', textAlign: 'center', marginTop: 16 }}>
          <T en="New here?" te="కొత్తవారా?" />{' '}
          <Link href="/signup" style={{ color: 'var(--blue-900)', fontWeight: 700 }}><T en="Create an account" te="ఖాతా సృష్టించండి" /></Link>
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
          <button type="button" onClick={() => setLang('en')} style={{ fontSize: 12.5, fontWeight: 700, color: lang === 'en' ? 'var(--blue-900)' : 'var(--ink-300)' }}>English</button>
          <span style={{ color: 'var(--line)' }}>|</span>
          <button type="button" onClick={() => setLang('te')} style={{ fontSize: 12.5, fontWeight: 700, color: lang === 'te' ? 'var(--blue-900)' : 'var(--ink-300)' }} className="te">తెలుగు</button>
        </div>
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

export const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14 };
