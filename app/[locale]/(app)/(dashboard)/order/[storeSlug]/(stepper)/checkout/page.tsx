import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import OrderStoreSlugCheckout from ".";

interface OrderStoreSlugCheckoutPageProps {
  params: Promise<{ locale: Locale; storeSlug: string }>;
}

const OrderStoreSlugCheckoutPage = async ({
  params,
}: OrderStoreSlugCheckoutPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderStoreSlugCheckout />;
};

export default OrderStoreSlugCheckoutPage;
