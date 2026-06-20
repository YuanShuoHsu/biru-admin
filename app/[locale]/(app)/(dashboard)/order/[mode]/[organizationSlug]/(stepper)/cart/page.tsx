import { setRequestLocale } from "next-intl/server";

import OrderModeOrganizationSlugCart from ".";

import type { Locale } from "@/i18n/routing";

interface OrderModeOrganizationSlugCartPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrderModeOrganizationSlugCartPage = async ({
  params,
}: OrderModeOrganizationSlugCartPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeOrganizationSlugCart />;
};

export default OrderModeOrganizationSlugCartPage;
