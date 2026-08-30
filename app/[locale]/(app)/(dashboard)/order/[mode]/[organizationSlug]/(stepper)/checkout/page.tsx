import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrderModeOrganizationSlugCheckout from ".";

import type { Locale } from "@/i18n/routing";

import { getOrganization } from "@/utils/organizations";

interface OrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ locale: Locale; organizationSlug: string }>;
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
  const { locale, organizationSlug } = await params;

  setRequestLocale(locale);

  const organization = await getOrganization(organizationSlug);
  if (!organization) return notFound();

  return <OrderModeOrganizationSlugCheckout organization={organization} />;
};

export default OrderModeOrganizationSlugCheckoutPage;
