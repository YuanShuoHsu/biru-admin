import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import CustomizedDialogs from "@/components/CustomizedDialogs";
import HideAppBar from "@/components/HideAppBar";
import NavTemporaryDrawer from "@/components/NavTemporaryDrawer";
import ScrollTop from "@/components/ScrollTop";

import { routing } from "@/i18n/routing";

import { KeyboardArrowUp } from "@mui/icons-material";
import { Box, Fab, Toolbar } from "@mui/material";

const AppLayout = async ({ children, params }: LayoutProps<"/[locale]">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <Box display="flex">
      <HideAppBar />
      <Suspense>
        <NavTemporaryDrawer />
      </Suspense>
      <Box
        component="main"
        bgcolor="background.default"
        display="flex"
        flexDirection="column"
        minHeight="100dvh"
        sx={{
          transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        width="100%"
      >
        <Toolbar id="back-to-top-anchor" />
        {children}
      </Box>
      <ScrollTop>
        <Fab aria-label="scroll back to top" size="small">
          <KeyboardArrowUp />
        </Fab>
      </ScrollTop>
      <CustomizedDialogs />
    </Box>
  );
};

export default AppLayout;
