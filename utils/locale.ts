import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

import type { LocalizedText } from "@/types/locale";

export const localize = (
  text: LocalizedText | null | undefined,
  lang: Locale = routing.defaultLocale,
): string => {
  if (!text) return "";

  return (
    text[lang] ||
    text[routing.defaultLocale] ||
    Object.values(text).find(Boolean) ||
    ""
  );
};

export const hasAllLocalizedText = (text?: LocalizedText | null): boolean =>
  routing.locales.every((lang) => Boolean(text?.[lang]?.trim()));
