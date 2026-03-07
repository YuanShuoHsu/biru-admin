import type { CountryCode } from "libphonenumber-js";

export interface CountryType {
  code: CountryCode;
  label: string;
  phone: string;
  suggested?: boolean;
}

export type CountryOption = CountryType & { firstLetter: string };
