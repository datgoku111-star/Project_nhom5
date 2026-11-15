"use client";

import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "@/locales/en/common.json";
import vnCommon from "@/locales/vn/common.json";
import { AppLanguage, DEFAULT_LANGUAGE } from "@/lib/locale";

export const resources = {
  en: {
    common: enCommon,
  },
  vn: {
    common: vnCommon,
  },
} as const;

export const createI18nInstance = (language: AppLanguage) => {
  const instance = createInstance();

  instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: ["common"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return instance;
};
