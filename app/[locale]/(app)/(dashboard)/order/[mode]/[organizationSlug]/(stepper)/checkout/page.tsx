import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import OrderModeOrganizationSlugCheckout from ".";

import type { Locale } from "@/i18n/routing";

interface OrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: OrderModeOrganizationSlugCheckoutPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("order.mode.storeSlug.tableNumber.stepper.checkout.label"),
  };
};

const OrderModeOrganizationSlugCheckoutPage = async ({
  params,
}: OrderModeOrganizationSlugCheckoutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeOrganizationSlugCheckout />;
};

export default OrderModeOrganizationSlugCheckoutPage;
