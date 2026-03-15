import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import compiled locale resources map (default export to avoid name conflicts)
import localeResources from "@/locales";

// Define available languages
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// Format resources for i18next
const i18nResources = {
  en: { translation: localeResources.en },
  es: { translation: localeResources.es },
  fr: { translation: localeResources.fr },
};

// i18n configuration
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: i18nResources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),

    // Detection options
    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    // React i18next options
    react: {
      useSuspense: false, // We'll handle loading manually for now
    },

    // General options
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },

    // Debugging (enable in development)
    debug: process.env.NODE_ENV === "development",

    // Namespace separator
    nsSeparator: ".",
    keySeparator: ".",
  });

export default i18n;
