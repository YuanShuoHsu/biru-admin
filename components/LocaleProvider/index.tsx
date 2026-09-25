// https://mui.com/material-ui/guides/localization/#Locales.tsx
// https://mui.com/x/react-date-pickers/adapters-locale/#LocalizationDayjs.tsx
// https://mui.com/x/react-scheduler/event-calendar/localization/#DateLocaleCalendar.tsx

"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { enUS, ja, ko, zhCN, zhTW } from "date-fns/locale";

import { LocaleEnum } from "@/enums/Locale";

import type { Locale } from "@/i18n/routing";

import * as muiLocales from "@mui/material/locale";
import {
  createTheme,
  type ThemeOptions,
  ThemeProvider,
} from "@mui/material/styles";
import * as dataGridLocales from "@mui/x-data-grid/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import * as pickersLocales from "@mui/x-date-pickers/locales";
import * as schedulerLocales from "@mui/x-scheduler/locales";

import theme from "@/theme";

import "dayjs/locale/en";
import "dayjs/locale/ja";
import "dayjs/locale/ko";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";

const themeLocales: Record<Locale, ThemeOptions[]> = {
  [LocaleEnum.ZhTW]: [
    dataGridLocales.zhTW,
    muiLocales.zhTW,
    pickersLocales.zhTW,
    schedulerLocales.zhTW,
    schedulerLocales.createDateLocaleTheme(zhTW),
  ],
  [LocaleEnum.En]: [
    dataGridLocales.enUS,
    muiLocales.enUS,
    pickersLocales.enUS,
    schedulerLocales.enUS,
    schedulerLocales.createDateLocaleTheme(enUS),
  ],
  [LocaleEnum.Ja]: [
    dataGridLocales.jaJP,
    muiLocales.jaJP,
    pickersLocales.jaJP,
    schedulerLocales.jaJP,
    schedulerLocales.createDateLocaleTheme(ja),
  ],
  [LocaleEnum.Ko]: [
    dataGridLocales.koKR,
    muiLocales.koKR,
    pickersLocales.koKR,
    schedulerLocales.koKR,
    schedulerLocales.createDateLocaleTheme(ko),
  ],
  [LocaleEnum.ZhCN]: [
    dataGridLocales.zhCN,
    muiLocales.zhCN,
    pickersLocales.zhCN,
    schedulerLocales.zhCN,
    schedulerLocales.createDateLocaleTheme(zhCN),
  ],
};

interface LocaleProviderProps {
  children: React.ReactNode;
}

const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const locale = useLocale();

  const themeWithLocale = useMemo(
    () => createTheme(theme, ...themeLocales[locale]),
    [locale],
  );

  return (
    <ThemeProvider theme={themeWithLocale}>
      <LocalizationProvider
        adapterLocale={locale.toLowerCase()}
        dateAdapter={AdapterDayjs}
      >
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default LocaleProvider;
