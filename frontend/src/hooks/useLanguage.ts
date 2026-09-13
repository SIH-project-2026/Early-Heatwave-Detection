import { useState, useEffect, useCallback } from 'react';
import { getTranslation } from '../utils/translations';

export const useLanguage = () => {
  const [lang, setLang] = useState<string>(() => {
    try {
      return localStorage.getItem('user_language') || 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    const handleLanguageChange = (e: any) => {
      try {
        const incoming = e?.detail || localStorage.getItem('user_language') || 'en';
        setLang(incoming);
      } catch (err) {
        console.error('Language sync error:', err);
      }
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const t = useCallback((key: string): string => {
    return getTranslation(key) || key;
  }, []);

  return { lang, t };
};