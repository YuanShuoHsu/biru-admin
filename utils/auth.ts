import { UAParser } from "ua-parser-js";

import { LocaleEnum } from "@/enums/Locale";

import type { Session } from "@/types/auth";

export const formatUserAgent = (userAgent?: string | null): string => {
  if (!userAgent) return "";

  const {
    browser: { name: browserName },
    os: { name: osName },
  } = new UAParser(userAgent).getResult();

  return [browserName, osName].filter(Boolean).join(" · ");
};

export const getDisplayName = (user?: Session["user"] | null) => {
  if (!user) return "";

  const nameParts =
    user.lang === LocaleEnum.En
      ? [user.firstName, user.lastName]
      : [user.lastName, user.firstName];

  const name = nameParts
    .filter(Boolean)
    .join(user.lang === LocaleEnum.En ? " " : "");

  return name || user.email || "";
};
