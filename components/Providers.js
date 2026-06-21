'use client';
import { LangProvider } from '@/components/LangContext';
import { AuthProvider } from '@/components/AuthContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <LangProvider>{children}</LangProvider>
    </AuthProvider>
  );
}
