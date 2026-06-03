import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

import { Grid, Stack } from "@mui/material";

interface DashboardLayoutProps extends LayoutProps<"/[locale]"> {
  breadcrumb: React.ReactNode;
  subheader: React.ReactNode;
  toolbar: React.ReactNode;
}

const DashboardLayout = async ({
  breadcrumb,
  children,
  params,
  subheader,
  toolbar,
}: DashboardLayoutProps) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <Stack padding={2} height="100%" gap={2}>
      <Grid container alignItems="center" gap={2}>
        <Grid size={{ xs: 12, sm: "grow" }}>{breadcrumb}</Grid>
        <Grid size={{ xs: 12, sm: "auto" }}>{toolbar}</Grid>
      </Grid>
      {subheader}
      {children}
    </Stack>
  );
};

export default DashboardLayout;
