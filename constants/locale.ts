import type { CountryCode } from "libphonenumber-js";

import { LocaleEnum } from "@/enums/Locale";

import type { Locale } from "@/i18n/routing";

import * as muiLocales from "@mui/material/locale";
import type { ThemeOptions } from "@mui/material/styles";
import * as dataGridLocales from "@mui/x-data-grid/locales";
import * as pickersLocales from "@mui/x-date-pickers/locales";

import type { EcpayLanguage } from "@/types/ecpay";

type DayjsLocale = "zh-tw" | "en" | "ja" | "ko" | "zh-cn";

interface LocaleConfig {
  countryCode: CountryCode;
  dayjs: DayjsLocale;
  ecpayLanguage?: EcpayLanguage;
  label: string;
  mui: ThemeOptions[];
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  [LocaleEnum.ZhTW]: {
    countryCode: "TW",
    dayjs: "zh-tw",
    label: "繁體中文",
    mui: [dataGridLocales.zhTW, muiLocales.zhTW, pickersLocales.zhTW],
  },
  [LocaleEnum.En]: {
    countryCode: "US",
    dayjs: "en",
    ecpayLanguage: "ENG",
    label: "English",
    mui: [dataGridLocales.enUS, muiLocales.enUS, pickersLocales.enUS],
  },
  [LocaleEnum.Ja]: {
    countryCode: "JP",
    dayjs: "ja",
    ecpayLanguage: "JPN",
    label: "日本語",
    mui: [dataGridLocales.jaJP, muiLocales.jaJP, pickersLocales.jaJP],
  },
  [LocaleEnum.Ko]: {
    countryCode: "KR",
    dayjs: "ko",
    ecpayLanguage: "KOR",
    label: "한국어",
    mui: [dataGridLocales.koKR, muiLocales.koKR, pickersLocales.koKR],
  },
  [LocaleEnum.ZhCN]: {
    countryCode: "CN",
    dayjs: "zh-cn",
    ecpayLanguage: "CHI",
    label: "简体中文",
    mui: [dataGridLocales.zhCN, muiLocales.zhCN, pickersLocales.zhCN],
  },
};
