import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/i18n";

/**
 * Custom hook for i18n with additional utilities
 */
export function useI18n() {
  const { t, i18n, ready } = useTranslation();

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = (languageCode: LanguageCode) => {
    return i18n.changeLanguage(languageCode);
  };

  const isLanguage = (languageCode: LanguageCode) => {
    return i18n.language === languageCode;
  };

  return {
    // Core i18n functions
    t,
    i18n,
    ready,

    // Current language info
    currentLanguage,
    languageCode: currentLanguage.code as LanguageCode,
    languageName: currentLanguage.name,
    languageFlag: currentLanguage.flag,

    // Language utilities
    changeLanguage,
    isLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

/**
 * Type for the useI18n hook return value
 */
export type UseI18nReturn = ReturnType<typeof useI18n>;