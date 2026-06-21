'use client';
import { RoleRail } from '@/components/Shell';

export default function PatientLayout({ children }) {
  return (
    <div id="app" className="ctx-patient">
      <RoleRail activeRole="patient" />
      <div className="main">{children}</div>
    </div>
  );
}
