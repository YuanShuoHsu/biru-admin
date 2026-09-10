import { UAParser } from "ua-parser-js";

import { LocaleEnum } from "@/enums/Locale";

import type { Locale } from "@/i18n/routing";

import type { Session } from "@/types/auth";

export const formatUserAgent = (userAgent?: string | null): string => {
  if (!userAgent) return "";

  const {
    browser: { name: browserName },
    os: { name: osName },
  } = new UAParser(userAgent).getResult();

  return [browserName, osName].filter(Boolean).join(" · ");
};

export const formatFullName = (
  locale: Locale,
  firstName: string | null,
  lastName?: string | null,
) => {
  const isEnLocale = locale === LocaleEnum.En;

  return (isEnLocale ? [firstName, lastName] : [lastName, firstName])
    .filter(Boolean)
    .join(isEnLocale ? " " : "");
};

export const getDisplayName = (user?: Session["user"] | null) => {
  if (!user) return "";

  const name = formatFullName(user.lang, user.firstName, user.lastName);

  return name || user.email || "";
};
