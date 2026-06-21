'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LangCtx = createContext({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('mediflow_lang') : null;
    if (saved) setLangState(saved);
  }, []);

  const setLang = (l) => {
    setLangState(l);
    if (typeof window !== 'undefined') window.localStorage.setItem('mediflow_lang', l);
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

export function T({ en, te }) {
  const { lang } = useLang();
  return lang === 'te' ? <span className="te">{te}</span> : <span>{en}</span>;
}

export function t(lang, en, te) {
  return lang === 'te' ? te : en;
}
