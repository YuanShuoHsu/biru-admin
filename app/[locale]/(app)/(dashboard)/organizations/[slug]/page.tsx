import { setRequestLocale } from "next-intl/server";

import OrganizationDetail from ".";

import type { Locale } from "@/i18n/routing";

interface OrganizationDetailPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationDetailPage = async ({
  params,
}: OrganizationDetailPageProps) => {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  return <OrganizationDetail slug={decodeURIComponent(slug)} />;
};

export default OrganizationDetailPage;
