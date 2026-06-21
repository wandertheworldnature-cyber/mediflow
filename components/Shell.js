'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { I } from '@/components/icons';
import { T, t, useLang } from '@/components/LangContext';
import { useSession } from '@/components/SessionContext';

export const ROLES = [
  { id: 'admin', label: 'Admin', te: 'అడ్మిన్', icon: 'building', ctx: 'ctx-admin', path: '/admin' },
  { id: 'doctor', label: 'Doctor', te: 'డాక్టర్', icon: 'stethoscope', ctx: 'ctx-doctor', path: '/doctor' },
  { id: 'nurse', label: 'Nurse', te: 'నర్స్', icon: 'syringe', ctx: 'ctx-nurse', path: '/nurse' },
  { id: 'patient', label: 'Patient', te: 'పేషెంట్', icon: 'heart', ctx: 'ctx-patient', path: '/patient' },
];

export function RoleRail({ activeRole }) {
  const { lang, setLang } = useLang();
  const { setSession } = useSession();
  const router = useRouter();

  return (
    <div className="rail">
      <div className="rail-logo">
        <Image src="/logo.png" alt="MediFlow" width={38} height={38} style={{ objectFit: 'cover' }} />
      </div>
      {ROLES.map((r) => {
        const Icon = I[r.icon];
        const active = activeRole === r.id;
        return (
          <button key={r.id} className={`rail-btn ${active ? 'active' : ''} ${r.ctx}`} onClick={() => router.push(r.path)}>
            <Icon size={21} strokeWidth={active ? 2.2 : 1.75} />
            <span><T en={r.label} te={r.te} /></span>
          </button>
        );
      })}
      <div className="rail-spacer" />
      <button className="rail-btn rail-logout" onClick={() => { setSession(null); router.push('/login'); }}>
        <I.logout size={20} strokeWidth={1.75} />
        <span><T en="Exit" te="నిష్క్రమణ" /></span>
      </button>
      <div className="rail-lang">
        <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        <button className={lang === 'te' ? 'on' : ''} onClick={() => setLang('te')}>తె</button>
      </div>
    </div>
  );
}

export function TopBar({ roleLabel, roleTe, title, titleTe, initials, children }) {
  const { lang } = useLang();
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="role-badge">{t(lang, roleLabel, roleTe)}</span>
        <span className="topbar-title">{t(lang, title, titleTe || title)}</span>
      </div>
      <div className="topbar-right">
        {children}
        <button className="icon-btn"><I.bell size={18} /></button>
        <div className="avatar">{initials}</div>
      </div>
    </div>
  );
}

export function SubNav({ tabs, active, setActive }) {
  const { lang } = useLang();
  return (
    <div className="subnav">
      {tabs.map((tab) => (
        <button key={tab.id} className={active === tab.id ? 'active' : ''} onClick={() => setActive(tab.id)}>
          {t(lang, tab.label, tab.te)}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, labelTe, value, sub, icon }) {
  const { lang } = useLang();
  const Icon = icon ? I[icon] : null;
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 8 }}>{t(lang, label, labelTe)}</div>
          <div className="display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink-900)' }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--mint-500)', fontWeight: 700, marginTop: 5 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-100)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={19} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Spinner({ size = 22 }) {
  return <I.loader size={size} className="spin" style={{ color: 'var(--accent)' }} />;
}

export function CenterLoader({ label, labelTe }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--ink-500)' }}>
      <Spinner size={28} />
      {label && <span style={{ fontSize: 13 }}><T en={label} te={labelTe || label} /></span>}
    </div>
  );
}
