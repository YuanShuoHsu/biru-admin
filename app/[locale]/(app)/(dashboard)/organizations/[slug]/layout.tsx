import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrganizationsSlugTabs from "./OrganizationsSlugTabs";

import { routing } from "@/i18n/routing";

interface OrganizationsSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

const OrganizationsSlugLayout = async ({
  children,
  params,
}: OrganizationsSlugLayoutProps) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <OrganizationsSlugTabs>{children}</OrganizationsSlugTabs>;
};

export default OrganizationsSlugLayout;
