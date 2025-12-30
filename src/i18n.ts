import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./i18n/en.json";
import fr from "./i18n/fr.json";
import ar from "./i18n/ar.json";

const STORAGE_KEY = "souli_lang";

const getInitialLang = () => {
  // 1️⃣ User preference always wins
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "fr" || saved === "en" || saved === "ar") {
    return saved;
  }

  // 2️⃣ Browser language detection (fallback)
  const nav = navigator.language?.toLowerCase() || "fr";
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("ar")) return "ar";

  // 3️⃣ DEFAULT = FRENCH
  return "fr";
};

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar }
  },
  lng: getInitialLang(),
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false
  }
});

// Language switch helper
export const setLanguage = async (lng: "fr" | "en" | "ar") => {
  await i18n.changeLanguage(lng);
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
};

export default i18n;
