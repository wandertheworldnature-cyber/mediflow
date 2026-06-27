'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { I } from '@/components/icons';
import { T, t, useLang } from '@/components/LangContext';
import { useAuth } from '@/components/AuthContext';

export const ROLES = [
  { id: 'admin', label: 'Admin', te: 'అడ్మిన్', icon: 'building', ctx: 'ctx-admin', path: '/admin' },
  { id: 'doctor', label: 'Doctor', te: 'డాక్టర్', icon: 'stethoscope', ctx: 'ctx-doctor', path: '/doctor' },
  { id: 'nurse', label: 'Nurse', te: 'నర్స్', icon: 'syringe', ctx: 'ctx-nurse', path: '/nurse' },
  { id: 'patient', label: 'Patient', te: 'పేషెంట్', icon: 'heart', ctx: 'ctx-patient', path: '/patient' },
];

export function RoleRail({ activeRole }) {
  const { lang, setLang } = useLang();
  const { user, signOut } = useAuth();
  const router = useRouter();

  // With real auth, people only ever see the rail item for their own role
  // — there's no "switch role" picker anymore, since role is a property of
  // the signed-in account, not a UI choice. Super Admin gets its own
  // separate item since it's not in the ROLES list (it has no hospital).
  const myRoleEntry = ROLES.find((r) => r.id === user?.role);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="rail">
      <div className="rail-logo">
        <Image src="/logo.png" alt="MediFlow" width={38} height={38} style={{ objectFit: 'cover' }} />
      </div>
      {user?.role === 'super_admin' && (
        <button className="rail-btn active ctx-admin" onClick={() => router.push('/super-admin')}>
          <I.shieldCheck size={21} strokeWidth={2.2} />
          <span><T en="Super Admin" te="సూపర్ అడ్మిన్" /></span>
        </button>
      )}
      {myRoleEntry && (
        <button className={`rail-btn active ${myRoleEntry.ctx}`} onClick={() => router.push(myRoleEntry.path)}>
          {(() => { const Icon = I[myRoleEntry.icon]; return <Icon size={21} strokeWidth={2.2} />; })()}
          <span><T en={myRoleEntry.label} te={myRoleEntry.te} /></span>
        </button>
      )}
      <div className="rail-spacer" />
      {user && (
        <div style={{ fontSize: 10, color: '#8FA0B8', textAlign: 'center', padding: '0 4px 8px', lineHeight: 1.3 }}>
          {user.hospitalName || (user.role === 'super_admin' ? 'All Hospitals' : '')}
        </div>
      )}
      <button className="rail-btn rail-logout" onClick={handleSignOut}>
        <I.logout size={20} strokeWidth={1.75} />
        <span><T en="Sign Out" te="సైన్ అవుట్" /></span>
      </button>
      <div className="rail-lang">
        <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        <button className={lang === 'te' ? 'on' : ''} onClick={() => setLang('te')}>తె</button>
      </div>
    </div>
  );
}

export function TopBar({ roleLabel, roleTe, title, titleTe, initials, children, pendingCount = 0, onBellClick }) {
  const { lang } = useLang();
  return (
    <div className="topbar" style={{ height: 'auto', padding: '0 28px', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Hospital name banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--teal-700) 100%)',
        margin: '0 -28px',
        padding: '10px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '3px 8px', borderRadius: 5,
          }}>{t(lang, roleLabel, roleTe)}</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', fontFamily: 'Manrope, sans-serif' }}>
            {t(lang, title, titleTe || title)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {children}
          <button className="icon-btn" onClick={onBellClick} style={{ position: 'relative', background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
            <I.bell size={18} />
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, width: 18, height: 18,
                background: 'var(--red-500)', borderRadius: '50%', fontSize: 10, fontWeight: 800,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
            )}
          </button>
          <div className="avatar" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}>{initials}</div>
        </div>
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
