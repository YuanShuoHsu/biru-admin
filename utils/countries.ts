import {
  type CountryCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

import { countries } from "@/constants/countries";
import { localeConfigs } from "@/constants/locale";

import type { Locale } from "@/i18n/routing";

import type { CountryType } from "@/types/countries";

export const formatPhone = (phone: CountryType["phone"]) => `+${phone}`;

export const getDefaultCountry = (locale: Locale) => {
  const countryCode = localeConfigs[locale].countryCode;

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
    countryCode: parsed?.country || localeConfigs[locale].countryCode,
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
