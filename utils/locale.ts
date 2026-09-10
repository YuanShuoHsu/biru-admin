import * as z from "zod";

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

const refineLocalizedText =
  (message: string, required: boolean) =>
  (text: LocalizedText | null | undefined, ctx: z.RefinementCtx): void => {
    const missing = routing.locales.filter((lang) => !text?.[lang]?.trim());

    if (!required && missing.length === routing.locales.length) return;

    missing.forEach((lang) =>
      ctx.addIssue({ code: "custom", message, path: [lang] }),
    );
  };

export const refineRequiredLocalizedText = (message: string) =>
  refineLocalizedText(message, true);

export const refineOptionalLocalizedText = (message: string) =>
  refineLocalizedText(message, false);
