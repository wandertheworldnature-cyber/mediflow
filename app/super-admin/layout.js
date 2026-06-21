'use client';
import { RoleRail } from '@/components/Shell';

export default function SuperAdminLayout({ children }) {
  return (
    <div id="app" className="ctx-admin">
      <RoleRail activeRole="super_admin" />
      <div className="main">{children}</div>
    </div>
  );
}
