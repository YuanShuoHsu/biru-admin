import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import OrderModeOrganizationSlugComplete from ".";

interface OrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ locale: Locale; mode: string; organizationSlug: string }>;
}

const OrderModeOrganizationSlugCompletePage = async ({
  params,
}: OrderModeOrganizationSlugCompletePageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeOrganizationSlugComplete />;
};

export default OrderModeOrganizationSlugCompletePage;
