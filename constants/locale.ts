import { LocaleEnum } from "@/enums/Locale";

import type { Locale } from "@/i18n/routing";

import * as muiLocales from "@mui/material/locale";
import * as dataGridLocales from "@mui/x-data-grid/locales";
import * as pickersLocales from "@mui/x-date-pickers/locales";

import type { LocaleConfig } from "@/types/locale";

export const locales: Record<Locale, LocaleConfig> = {
  [LocaleEnum.ZhTW]: {
    countryCode: "TW",
    dayjs: "zh-tw",
    ecpay: "",
    label: "繁體中文",
    mui: [dataGridLocales.zhTW, muiLocales.zhTW, pickersLocales.zhTW],
  },
  [LocaleEnum.En]: {
    countryCode: "US",
    dayjs: "en",
    ecpay: "ENG",
    label: "English",
    mui: [dataGridLocales.enUS, muiLocales.enUS, pickersLocales.enUS],
  },
  [LocaleEnum.Ja]: {
    countryCode: "JP",
    dayjs: "ja",
    ecpay: "JPN",
    label: "日本語",
    mui: [dataGridLocales.jaJP, muiLocales.jaJP, pickersLocales.jaJP],
  },
  [LocaleEnum.Ko]: {
    countryCode: "KR",
    dayjs: "ko",
    ecpay: "KOR",
    label: "한국어",
    mui: [dataGridLocales.koKR, muiLocales.koKR, pickersLocales.koKR],
  },
  [LocaleEnum.ZhCN]: {
    countryCode: "CN",
    dayjs: "zh-cn",
    ecpay: "CHI",
    label: "简体中文",
    mui: [dataGridLocales.zhCN, muiLocales.zhCN, pickersLocales.zhCN],
  },
};
