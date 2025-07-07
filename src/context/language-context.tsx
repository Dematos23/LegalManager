
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { es } from '@/dictionaries/es';
import { en } from '@/dictionaries/en';

type Dictionary = typeof en;

interface LanguageContextType {
  language: 'en' | 'es';
  dictionary: Dictionary;
  switchLanguage: (language: 'en' | 'es') => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<'en' | 'es'>('es');
    const [dictionary, setDictionary] = useState<Dictionary>(es);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const storedLang = localStorage.getItem('language') as 'en' | 'es' | null;
        const initialLang = storedLang || 'es';
        setLanguage(initialLang);
        setDictionary(initialLang === 'es' ? es : en);
    }, []);

    const switchLanguage = (lang: 'en' | 'es') => {
        if(isMounted) {
            localStorage.setItem('language', lang);
        }
        setLanguage(lang);
        setDictionary(lang === 'es' ? es : en);
    };

    const value = { language, dictionary, switchLanguage };

    if (!isMounted) {
        return null; // or a loading spinner
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
