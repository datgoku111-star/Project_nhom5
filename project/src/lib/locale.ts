export const SUPPORTED_LANGUAGES = ["en", "vn"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "vn";

export const isAppLanguage = (language?: string | null): language is AppLanguage =>
  language === "en" || language === "vn";

export const toHtmlLanguage = (language: AppLanguage) =>
  language === "vn" ? "vi" : "en";

export const toFormattingLocale = (language: AppLanguage) =>
  language === "vn" ? "vi-VN" : "en-US";
