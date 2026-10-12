import 'expo-sqlite/localStorage/install';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'si', name: 'සිංහල' },
  { code: 'ta', name: 'தமிழ்' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'language';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: localStorage.getItem(STORAGE_KEY) ?? 'en',
  fallbackLng: 'en',
  supportedLngs: LANGUAGES.map((language) => language.code),
  interpolation: { escapeValue: false },
});

export function setLanguage(code: LanguageCode) {
  localStorage.setItem(STORAGE_KEY, code);
  return i18n.changeLanguage(code);
}

export function languageName(code: string) {
  return LANGUAGES.find((language) => language.code === code)?.name ?? LANGUAGES[0].name;
}

export function translateOption(value: string) {
  return i18n.t(`options.${value}`, { defaultValue: value });
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString(i18n.language, options);
}

export function formatTime(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleTimeString(i18n.language, options);
}

export default i18n;
