'use client';
import { RoleRail } from '@/components/Shell';

export default function AdminLayout({ children }) {
  return (
    <div id="app" className="ctx-admin">
      <RoleRail activeRole="admin" />
      <div className="main">{children}</div>
    </div>
  );
}
