import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import OrderStoreSlugComplete from ".";

interface OrderStoreSlugCompletePageProps {
  params: Promise<{ locale: Locale }>;
}

const OrderStoreSlugCompletePage = async ({
  params,
}: OrderStoreSlugCompletePageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderStoreSlugComplete />;
};

export default OrderStoreSlugCompletePage;
