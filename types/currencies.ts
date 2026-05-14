import type { CountryCode } from "libphonenumber-js";

export interface CurrencyType {
  code: CountryCode;
  currency: string;
  label: string;
}
