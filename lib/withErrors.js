import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth';

// Wraps an API route handler so AuthError instances become proper
// 401/403 responses and everything else becomes a 500 — used by every
// route so error handling is consistent instead of hand-copied N times.
export function withErrors(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status: 500 });
    }
  };
}
