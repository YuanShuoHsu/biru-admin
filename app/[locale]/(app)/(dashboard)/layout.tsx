import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";

import { Stack } from "@mui/material";

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
      <Stack flexDirection="row" flexWrap="wrap" alignItems="center" gap={2}>
        {breadcrumb}
        {toolbar}
      </Stack>
      {subheader}
      {children}
    </Stack>
  );
};

export default DashboardLayout;
