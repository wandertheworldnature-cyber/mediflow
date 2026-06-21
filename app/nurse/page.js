'use client';
import { useState, useEffect, useCallback } from 'react';
import { TopBar, SubNav, CenterLoader, Spinner } from '@/components/Shell';
import { T, t, useLang } from '@/components/LangContext';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useToast } from '@/hooks/useToast';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { api } from '@/lib/api';
import { I } from '@/components/icons';

export default function NursePage() {
  const { ready, session } = useRequireRole('nurse');
  const toast = useToast();
  const [tab, setTab] = useState('wards');

  const tabs = [
    { id: 'wards', label: 'Ward Map', te: 'వార్డ్ మ్యాప్' },
    { id: 'tasks', label: 'Tasks', te: 'పనులు' },
  ];

  if (!ready) return <CenterLoader label="Loading…" labelTe="లోడ్ అవుతోంది…" />;

  return (
    <>
      <TopBar roleLabel="Nurse" roleTe="నర్స్" title={session?.fullName || ''} initials={session?.fullName?.[0] || 'N'} />
      <SubNav tabs={tabs} active={tab} setActive={setTab} />
      <div className="scroll-area">
        {tab === 'wards' && <WardMap toast={toast} />}
        {tab === 'tasks' && <NurseTasks toast={toast} />}
      </div>
      {toast.node}
    </>
  );
}

const bedStatusMeta = {
  occupied: { color: 'var(--blue-700)', bg: 'var(--blue-100)', label: 'Occupied', te: 'ఆక్యుపైడ్' },
  available: { color: 'var(--mint-500)', bg: 'var(--mint-100)', label: 'Available', te: 'అందుబాటులో' },
  cleaning: { color: '#A26200', bg: 'var(--amber-100)', label: 'Cleaning', te: 'శుభ్రం చేస్తున్నారు' },
};

function WardMap({ toast }) {
  const { lang } = useLang();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openWardId, setOpenWardId] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api('/wards');
      setWards(data || []);
      setOpenWardId((prev) => prev || data?.[0]?.id || null);
      // Keep the open bed modal's data fresh if it's currently open.
      setSelectedBed((prev) => {
        if (!prev) return prev;
        const ward = (data || []).find((w) => w.id === prev.ward_id);
        return ward?.beds.find((b) => b.id === prev.id) || null;
      });
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable('beds', load);

  const ward = wards.find((w) => w.id === openWardId);

  if (loading) return <CenterLoader label="Loading wards…" labelTe="వార్డులు లోడ్ అవుతున్నాయి…" />;

  return (
    <div className="fade-in" style={{ maxWidth: 980 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 22 }}>
        {wards.map((w) => (
          <button key={w.id} onClick={() => { setOpenWardId(w.id); setSelectedBed(null); }} className="card" style={{
            padding: '16px 18px', textAlign: 'left',
            borderColor: openWardId === w.id ? 'var(--accent)' : 'var(--line)',
            borderWidth: openWardId === w.id ? 2 : 1,
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 6 }}>{w.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="display" style={{ fontSize: 22, fontWeight: 800 }}>{w.occupied}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>/ {w.total_beds} <T en="beds" te="బెడ్‌లు" /></span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--line)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(w.occupied / w.total_beds) * 100}%`, background: 'var(--accent)', borderRadius: 4 }} />
            </div>
          </button>
        ))}
      </div>

      {ward && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15 }}>{ward.name}</h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              {Object.entries(bedStatusMeta).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: v.color, display: 'inline-block' }}></span>
                  <T en={v.label} te={v.te} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {ward.beds.map((b) => {
              const meta = bedStatusMeta[b.status];
              return (
                <button key={b.id} onClick={() => setSelectedBed({ ...b, ward_id: ward.id })} className="fade-in" style={{
                  aspectRatio: '1', borderRadius: 12, background: meta.bg, border: `1.5px solid ${meta.color}33`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8,
                }}>
                  <I.bed size={20} style={{ color: meta.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>Bed {b.bed_number}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedBed && <BedModal bed={selectedBed} onClose={() => setSelectedBed(null)} toast={toast} onChanged={load} />}
    </div>
  );
}

function BedModal({ bed, onClose, toast, onChanged }) {
  const { lang } = useLang();
  const [updating, setUpdating] = useState(false);
  const meta = bedStatusMeta[bed.status];

  const updateBed = async (body, successMsg) => {
    setUpdating(true);
    try {
      await api(`/beds/${bed.id}`, { method: 'PATCH', body });
      toast.show(successMsg);
      onChanged();
      onClose();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} className="card fade-in" style={{ width: 360, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15 }}><T en={`Bed ${bed.bed_number}`} te={`బెడ్ ${bed.bed_number}`} /></h3>
          <span className="pill" style={{ background: meta.bg, color: meta.color }}>
            <T en={meta.label} te={meta.te} />
          </span>
        </div>
        {bed.status === 'occupied' ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{bed.patients?.name || '—'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 18 }}>{bed.note}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => toast.show(t(lang, 'Vitals form opened', 'వైటల్స్ ఫారం తెరువబడింది'))}><T en="Log Vitals" te="వైటల్స్ నమోదు" /></button>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={updating}
                onClick={() => updateBed({ status: 'cleaning' }, t(lang, 'Patient discharged, bed marked for cleaning', 'పేషెంట్ డిశ్చార్జ్ చేయబడింది'))}>
                {updating ? <Spinner size={13} /> : <T en="Discharge" te="డిశ్చార్జ్" />}
              </button>
            </div>
          </>
        ) : bed.status === 'available' ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={updating}
            onClick={() => updateBed({ status: 'occupied', note: 'Stable' }, t(lang, 'Patient admitted to this bed', 'ఈ బెడ్‌లో పేషెంట్ చేరారు'))}>
            {updating ? <Spinner size={14} /> : <T en="Admit Patient Here" te="ఇక్కడ పేషెంట్‌ని చేర్చండి" />}
          </button>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={updating}
            onClick={() => updateBed({ status: 'available' }, t(lang, 'Bed marked available', 'బెడ్ అందుబాటులో ఉందని గుర్తించబడింది'))}>
            {updating ? <Spinner size={14} /> : <T en="Mark Cleaning Done" te="శుభ్రం పూర్తయిందని గుర్తించండి" />}
          </button>
        )}
      </div>
    </div>
  );
}

function NurseTasks({ toast }) {
  const { lang } = useLang();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api('/tasks');
      setTasks(data || []);
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useRealtimeTable('nurse_tasks', load);

  const toggle = async (task) => {
    // optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    try {
      await api(`/tasks/${task.id}`, { method: 'PATCH', body: { done: !task.done } });
    } catch (err) {
      toast.show(err.message, 'error');
      load();
    }
  };

  if (loading) return <CenterLoader label="Loading tasks…" labelTe="పనులు లోడ్ అవుతున్నాయి…" />;

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="fade-in" style={{ maxWidth: 640 }}>
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-700)' }}>
          <T en="Today's Tasks" te="ఈరోజు పనులు" /> <span style={{ color: 'var(--ink-500)', fontWeight: 500 }}>({pending.length} <T en="pending" te="పెండింగ్‌లో" />)</span>
        </div>
        {pending.map((task, i) => (
          <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <button onClick={() => toggle(task)} style={{ width: 22, height: 22, borderRadius: 7, border: '2px solid var(--line)', flexShrink: 0 }}></button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{task.title}</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600 }}>{task.task_time}</span>
          </div>
        ))}
        {pending.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}><T en="All caught up!" te="అన్నీ పూర్తయ్యాయి!" /></div>}
      </div>

      {done.length > 0 && (
        <div className="card" style={{ opacity: 0.7 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-500)' }}>
            <T en="Completed" te="పూర్తయింది" />
          </div>
          {done.map((task, i) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <button onClick={() => toggle(task)} style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--mint-500)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <I.check size={13} strokeWidth={3} />
              </button>
              <div style={{ flex: 1, textDecoration: 'line-through', fontSize: 13.5, color: 'var(--ink-500)' }}>{task.title}</div>
              <span style={{ fontSize: 12, color: 'var(--ink-300)', fontWeight: 600 }}>{task.task_time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
