import { countries } from "@/constants/countries";

import type { CurrencyType } from "@/types/currencies";

export const DEFAULT_CURRENCY_OPTION: CurrencyType = {
  code: "TW",
  currency: "TWD",
  label: "New Taiwan Dollar",
};

const allCurrencies = Intl.supportedValuesOf("currency");

export const currencies: CurrencyType[] = countries.flatMap((country) => {
  const currency = allCurrencies.find((currency) =>
    currency.startsWith(country.code),
  );

  return currency ? [{ ...country, currency }] : [];
});
