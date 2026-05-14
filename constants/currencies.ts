import { countries } from "@/constants/countries";

import type { CurrencyOption, CurrencyType } from "@/types/currencies";

const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });

const countryCodes = new Set<string>(countries.map(({ code }) => code));

export const DEFAULT_CURRENCY_OPTION: CurrencyOption = {
  code: "TW",
  currency: "TWD",
  firstLetter: "T",
  label: "New Taiwan Dollar",
};

export const currencies: readonly CurrencyType[] = Intl.supportedValuesOf(
  "currency",
)
  .filter((currency) => countryCodes.has(currency.slice(0, 2).toUpperCase()))
  .map((currency) => ({
    code: currency.slice(0, 2).toUpperCase(),
    currency,
    label: displayNames.of(currency) || currency,
  }));

export const CURRENCY_OPTIONS: CurrencyOption[] = currencies.map((option) => ({
  ...option,
  firstLetter: option.currency[0].toUpperCase(),
}));
