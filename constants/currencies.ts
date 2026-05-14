import { countries } from "@/constants/countries";

import type { CurrencyType } from "@/types/currencies";

const allCurrencies = Intl.supportedValuesOf("currency");

export const currencies: CurrencyType[] = countries.flatMap((country) => {
  const currency = allCurrencies.find((currency) =>
    currency.startsWith(country.code),
  );

  return currency ? [{ ...country, currency }] : [];
});

export const DEFAULT_CURRENCY_OPTION = currencies.find(
  ({ code }) => code === "TW",
)!;

