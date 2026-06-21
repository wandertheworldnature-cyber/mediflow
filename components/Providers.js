'use client';
import { LangProvider } from '@/components/LangContext';
import { SessionProvider } from '@/components/SessionContext';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <LangProvider>{children}</LangProvider>
    </SessionProvider>
  );
}
