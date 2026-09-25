import {
  type CountryCode,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

import { countries } from "@/constants/countries";

import type { Locale } from "@/i18n/routing";

import type { CountryType } from "@/types/countries";

export const formatPhone = (phone: CountryType["phone"]) => `+${phone}`;

const getLocaleCountryCode = (locale: Locale) => {
  const { region } = new Intl.Locale(locale).maximize();

  return region && isSupportedCountry(region) ? region : undefined;
};

export const getDefaultCountry = (locale: Locale) => {
  const countryCode = getLocaleCountryCode(locale);

  return countries.find(({ code }) => code === countryCode);
};

export const getPhoneDefaults = (
  phoneNumber: string | null | undefined,
  locale: Locale,
) => {
  const parsed = phoneNumber
    ? parsePhoneNumberFromString(phoneNumber)
    : undefined;

  return {
    countryCode: parsed?.country || getLocaleCountryCode(locale),
    telephone: parsed?.formatNational() || "",
  };
};

export const getPhoneFormatting = (countryCode?: string) => {
  if (!countryCode) return { mask: "0000000000", placeholder: "0123456789" };

  const exampleNumber = getExampleNumber(countryCode as CountryCode, examples);
  if (!exampleNumber) return { mask: "0000000000", placeholder: "0123456789" };

  const nationalFormat = exampleNumber.formatNational();

  const mask = nationalFormat.replace(/\d/g, "0");
  const placeholder = nationalFormat;

  return {
    mask,
    placeholder,
  };
};
