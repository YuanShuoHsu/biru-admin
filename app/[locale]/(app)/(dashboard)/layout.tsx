import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import RouterBreadcrumbs from "@/components/RouterBreadcrumbs";

import { routing } from "@/i18n/routing";

import { Stack } from "@mui/material";

interface DashboardLayoutProps extends LayoutProps<"/[locale]"> {
  toolbar: React.ReactNode;
}

const DashboardLayout = async ({
  children,
  params,
  toolbar,
}: DashboardLayoutProps) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <Stack padding={2} height="100%" gap={2}>
      <Stack
        flexWrap={{ xs: "wrap", sm: "nowrap" }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
      >
        <RouterBreadcrumbs />
        {toolbar}
      </Stack>
      {children}
    </Stack>
  );
};

export default DashboardLayout;
