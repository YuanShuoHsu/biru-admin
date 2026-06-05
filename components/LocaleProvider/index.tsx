// https://mui.com/material-ui/guides/localization/#Locales.tsx
// https://mui.com/x/react-date-pickers/adapters-locale/#LocalizationDayjs.tsx

"use client";

import { useLocale } from "next-intl";
import { useMemo } from "react";

import { localeConfigs } from "@/constants/locale";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import theme from "@/theme";

import "dayjs/locale/en";
import "dayjs/locale/ja";
import "dayjs/locale/ko";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";

interface LocaleProviderProps {
  children: React.ReactNode;
}

const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const locale = useLocale();

  const themeWithLocale = useMemo(
    () => createTheme(theme, ...localeConfigs[locale].mui),
    [locale],
  );

  return (
    <ThemeProvider theme={themeWithLocale}>
      <LocalizationProvider
        adapterLocale={localeConfigs[locale].dayjs}
        dateAdapter={AdapterDayjs}
      >
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default LocaleProvider;
