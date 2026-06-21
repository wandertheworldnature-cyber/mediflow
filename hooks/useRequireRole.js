'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionContext';

// Redirects to /login if there's no session, or if the session's role
// doesn't match the page being viewed (e.g. someone with a patient session
// navigating straight to /admin via URL).
export function useRequireRole(requiredRole) {
  const { session, loaded } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;
    if (!session || session.role !== requiredRole) {
      router.replace('/login');
    }
  }, [loaded, session, requiredRole]);

  return { session, ready: loaded && session?.role === requiredRole };
}
