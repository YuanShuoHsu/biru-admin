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
    compact: {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    date: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
    dateTime: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    monthDay: {
      month: "2-digit",
      day: "2-digit",
    },
    shift: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    short: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    },
    time: {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    weekday: {
      weekday: "short",
    },
    weekdayLong: {
      weekday: "long",
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
