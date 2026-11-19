import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en/translation.json';
import thTranslations from './locales/th/translation.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  th: {
    translation: thTranslations,
  },
};

const savedLng = typeof window !== 'undefined' ? window.localStorage.getItem('i18nextLng') : null;
const initialLng = savedLng && (savedLng.startsWith('en') || savedLng.startsWith('th')) ? savedLng : 'th';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'th',
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
  });

export default i18n;
