import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

import OrderModeOrganizationSlugComplete from ".";

interface OrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ locale: Locale; mode: string; organizationSlug: string }>;
}

const OrderModeOrganizationSlugCompletePage = async ({
  params,
}: OrderModeOrganizationSlugCompletePageProps) => {
  const { locale, organizationSlug } = await params;

  setRequestLocale(locale);

  const organization = await fetcher<OrganizationResponse>(
    `/api/organizations/${organizationSlug}`,
  ).catch(() => null);

  return <OrderModeOrganizationSlugComplete organization={organization} />;
};

export default OrderModeOrganizationSlugCompletePage;
