import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import en from "@/locales/en/common.json";
import vn from "@/locales/vn/common.json";
import {
  DEFAULT_LANGUAGE,
  isAppLanguage,
  toFormattingLocale,
  toHtmlLanguage,
} from "@/lib/locale";

const flattenKeys = (value: Record<string, unknown>, prefix = ""): string[] =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.[jt]sx?$/.test(entry.name) ? [path] : [];
  });

describe("i18n locale contract", () => {
  it("keeps EN and VN resources in sync", () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(vn).sort());
  });

  it("recognizes only supported application languages", () => {
    expect(DEFAULT_LANGUAGE).toBe("vn");
    expect(isAppLanguage("en")).toBe(true);
    expect(isAppLanguage("vn")).toBe(true);
    expect(isAppLanguage("vi")).toBe(false);
  });

  it("maps internal languages to standards-facing locales", () => {
    expect(toHtmlLanguage("vn")).toBe("vi");
    expect(toHtmlLanguage("en")).toBe("en");
    expect(toFormattingLocale("vn")).toBe("vi-VN");
    expect(toFormattingLocale("en")).toBe("en-US");
  });

  it("contains translations for the repaired checkout and report keys", () => {
    const requiredKeys = [
      "adminReportsTitle",
      "checkoutDeposit",
      "checkoutAlreadyPaid",
      "paydoneYourOrder",
    ] as const;

    requiredKeys.forEach((key) => {
      expect(en[key]).toBeTruthy();
      expect(vn[key]).toBeTruthy();
    });
  });

  it("defines every statically detectable translation key used by source", () => {
    const availableKeys = new Set(flattenKeys(en));
    const missingKeys = new Set<string>();
    const literalTranslationCall = /\bt\(\s*["'`]([^"'`$]+)["'`]/g;

    collectSourceFiles(join(process.cwd(), "src")).forEach((file) => {
      const source = readFileSync(file, "utf8");
      for (const match of Array.from(source.matchAll(literalTranslationCall))) {
        if (!availableKeys.has(match[1])) missingKeys.add(match[1]);
      }
    });

    expect(Array.from(missingKeys).sort()).toEqual([]);
  });
});
