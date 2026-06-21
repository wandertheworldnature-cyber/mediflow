'use client';
import { useState, useRef, useCallback } from 'react';
import { I } from '@/components/icons';

export function useToast() {
  const [state, setState] = useState(null); // { text, type }
  const timeoutRef = useRef(null);

  const show = useCallback((text, type = 'success') => {
    setState({ text, type });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setState(null), 2800);
  }, []);

  const node = (
    <div className={`toast ${state ? 'show' : ''} ${state?.type === 'error' ? 'error' : ''}`}>
      {state?.type === 'error' ? <I.alert size={16} /> : <I.check size={16} />}
      <span>{state?.text}</span>
    </div>
  );

  return { show, node };
}
