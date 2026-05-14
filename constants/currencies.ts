import { countries } from "@/constants/countries";

import type { CurrencyType } from "@/types/currencies";

const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });

const countryCodes = new Set<string>(countries.map(({ code }) => code));

export const DEFAULT_CURRENCY_OPTION: CurrencyType = {
  code: "TW",
  currency: "TWD",
  label: "New Taiwan Dollar",
};

export const currencies: CurrencyType[] = Intl.supportedValuesOf(
  "currency",
)
  .filter((currency) => countryCodes.has(currency.slice(0, 2).toUpperCase()))
  .map((currency) => ({
    code: currency.slice(0, 2).toUpperCase(),
    currency,
    label: displayNames.of(currency) || currency,
  }));

