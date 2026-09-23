import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { DashboardStack, HeaderStack } from "./styled";

import { routing } from "@/i18n/routing";

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
    <DashboardStack>
      <HeaderStack direction="row">
        {breadcrumb}
        {toolbar}
      </HeaderStack>
      {subheader}
      {children}
    </DashboardStack>
  );
};

export default DashboardLayout;
