"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "@/lib/i18n";
import { AppLanguage, isAppLanguage, toHtmlLanguage } from "@/lib/locale";
import { ReactNode } from "react";

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage: AppLanguage;
  hasLanguageCookie: boolean;
}

const I18nProvider = ({
  children,
  initialLanguage,
  hasLanguageCookie,
}: I18nProviderProps) => {
  const [i18n] = useState(() => createI18nInstance(initialLanguage));

  useEffect(() => {
    const handleLanguageChange = (language: string) => {
      if (!isAppLanguage(language)) return;

      document.documentElement.lang = toHtmlLanguage(language);
      window.localStorage.setItem("site-language", language);
      document.cookie = `site-language=${language}; path=/; max-age=31536000`;
    };

    const storedLanguage = window.localStorage.getItem("site-language");
    if (!hasLanguageCookie && isAppLanguage(storedLanguage)) {
      i18n.changeLanguage(storedLanguage);
      handleLanguageChange(storedLanguage);
    } else {
      handleLanguageChange(i18n.language);
    }

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [hasLanguageCookie, i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default I18nProvider;
