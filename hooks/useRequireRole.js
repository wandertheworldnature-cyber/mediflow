'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

// Redirects to /login if there's no real signed-in session, or if the
// account's actual role (verified server-side via /api/auth/me) doesn't
// match the page being viewed. Unlike the old demo version, this can't be
// spoofed by picking a different role in the UI — the role comes from the
// database via lib/auth.js on every API call regardless of what this hook
// gates client-side.
export function useRequireRole(requiredRole) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== requiredRole) {
      router.replace('/login');
    }
  }, [loading, user, requiredRole]);

  return { session: user, ready: !loading && user?.role === requiredRole };
}
