import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import OrderModeStoreSlugCheckout from ".";

interface OrderModeStoreSlugCheckoutPageProps {
  params: Promise<{ locale: Locale; mode: string; storeSlug: string }>;
}

const OrderModeStoreSlugCheckoutPage = async ({
  params,
}: OrderModeStoreSlugCheckoutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeStoreSlugCheckout />;
};

export default OrderModeStoreSlugCheckoutPage;
