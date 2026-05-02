import { setRequestLocale } from "next-intl/server";

import OrderModePickupStoreSlugSelect from "@/components/OrderModePickupStoreSlugSelect";

import type { Locale } from "@/i18n/routing";

interface OrderPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrderPage = async ({ params }: OrderPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModePickupStoreSlugSelect />;
};

export default OrderPage;
