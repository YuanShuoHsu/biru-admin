import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import OrderModeOrganizationSlugCart from ".";

import type { Locale } from "@/i18n/routing";

interface OrderModeOrganizationSlugCartPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: OrderModeOrganizationSlugCartPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("order.mode.storeSlug.tableNumber.stepper.cart.label"),
  };
};

const OrderModeOrganizationSlugCartPage = async ({
  params,
}: OrderModeOrganizationSlugCartPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeOrganizationSlugCart />;
};

export default OrderModeOrganizationSlugCartPage;
