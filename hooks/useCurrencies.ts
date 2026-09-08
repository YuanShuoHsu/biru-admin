"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { COUNTRY_CURRENCIES } from "@/constants/countryCurrencies";

import type { CurrencyType } from "@/types/currencies";

const CURRENCY_CODES = [...new Set(Object.values(COUNTRY_CURRENCIES))]
  .filter((currency) => currency !== undefined)
  .sort((a, b) => a.localeCompare(b));

const FLAG_CODES = Object.entries(COUNTRY_CURRENCIES).reduce<
  Record<string, string>
>(
  (acc, [code, currency]) => {
    if (currency?.startsWith(code)) acc[currency] = code;

    return acc;
  },
  { EUR: "EU" },
);

export const useCurrencies = (): CurrencyType[] => {
  const locale = useLocale();

  return useMemo(() => {
    const displayNames = new Intl.DisplayNames(locale, { type: "currency" });

    return CURRENCY_CODES.map((currency) => ({
      ...(FLAG_CODES[currency] && { code: FLAG_CODES[currency] }),
      currency,
      label: displayNames.of(currency) ?? currency,
    }));
  }, [locale]);
};
