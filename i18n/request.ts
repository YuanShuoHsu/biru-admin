// https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing
// https://next-intl.dev/docs/usage/configuration
// https://next-intl.dev/docs/workflows/typescript

import { Formats, hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { PLATFORM_TIMEZONE } from "@/constants/timezone";

import { routing } from "@/i18n/routing";

import enMessages from "@/messages";

export const formats = {
  dateTime: {
    date: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    compact: {
      day: "numeric",
      month: "numeric",
      hour: "numeric",
      minute: "numeric",
    },
    shift: {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    shiftDateTime: {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    shiftTime: {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
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
    timeZone: PLATFORM_TIMEZONE,
  };
});
