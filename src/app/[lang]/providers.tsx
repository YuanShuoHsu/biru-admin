"use client";

import { SnackbarProvider } from "notistack";

import { I18nDict } from "@/context/i18n";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";

import I18nProvider from "@/providers/I18nProvider";

import theme from "@/theme";

interface ProvidersProps {
  children: React.ReactNode;
  dict: I18nDict;
}

const Providers = ({ children, dict }: ProvidersProps) => (
  <I18nProvider dict={dict}>
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  </I18nProvider>
);

export default Providers;
