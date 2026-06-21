'use client';
import { RoleRail } from '@/components/Shell';

export default function NurseLayout({ children }) {
  return (
    <div id="app" className="ctx-nurse">
      <RoleRail activeRole="nurse" />
      <div className="main">{children}</div>
    </div>
  );
}
