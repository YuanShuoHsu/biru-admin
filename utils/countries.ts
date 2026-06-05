import { type CountryCode, getExampleNumber } from "libphonenumber-js";
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

export const getPhoneFormatting = (countryCode: CountryCode) => {
  const exampleNumber = getExampleNumber(countryCode, examples);
  if (!exampleNumber) return { mask: "0000000000", placeholder: "0123456789" };

  const nationalFormat = exampleNumber.formatNational();

  const mask = nationalFormat.replace(/\d/g, "0");
  const placeholder = nationalFormat;

  return {
    mask,
    placeholder,
  };
};
