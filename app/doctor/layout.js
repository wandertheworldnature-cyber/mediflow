'use client';
import { RoleRail } from '@/components/Shell';

export default function DoctorLayout({ children }) {
  return (
    <div id="app" className="ctx-doctor">
      <RoleRail activeRole="doctor" />
      <div className="main">{children}</div>
    </div>
  );
}
