import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import OrderModeOrganizationSlugCheckout from ".";

interface OrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ locale: Locale; mode: string; organizationSlug: string }>;
}

const OrderModeOrganizationSlugCheckoutPage = async ({
  params,
}: OrderModeOrganizationSlugCheckoutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeOrganizationSlugCheckout />;
};

export default OrderModeOrganizationSlugCheckoutPage;
