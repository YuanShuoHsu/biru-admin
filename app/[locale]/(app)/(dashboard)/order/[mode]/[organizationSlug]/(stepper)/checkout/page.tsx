import { setRequestLocale } from "next-intl/server";

import OrderModeOrganizationSlugCheckout from ".";

import type { Locale } from "@/i18n/routing";

interface OrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrderModeOrganizationSlugCheckoutPage = async ({
  params,
}: OrderModeOrganizationSlugCheckoutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeOrganizationSlugCheckout />;
};

export default OrderModeOrganizationSlugCheckoutPage;
