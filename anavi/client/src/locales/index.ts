// Locales index file — provides a typed resource map
// Used by i18n.ts to avoid direct JSON imports in multiple places

import en from './en.json';
import es from './es.json';
import fr from './fr.json';

export const resources = {
  en,
  es,
  fr,
} as const;

export type AvailableLocales = keyof typeof resources;

export default resources;

