// https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing
// https://next-intl.dev/docs/usage/configuration
// https://next-intl.dev/docs/workflows/typescript

import { Formats, hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";

import enMessages from "@/messages";

export const formats = {
  dateTime: {
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: "long",
      type: "conjunction",
    },
  },
} satisfies Formats;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = Object.fromEntries(
    await Promise.all(
      Object.keys(enMessages).map(async (namespace) => [
        namespace,
        (await import(`../messages/${locale}/${namespace}.json`)).default,
      ]),
    ),
  );

  return {
    formats,
    locale,
    messages,
  };
});
