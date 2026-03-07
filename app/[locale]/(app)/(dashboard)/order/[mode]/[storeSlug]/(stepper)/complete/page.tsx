import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import OrderModeStoreSlugComplete from ".";

interface OrderModeStoreSlugCompletePageProps {
  params: Promise<{ locale: Locale }>;
}

const OrderModeStoreSlugCompletePage = async ({
  params,
}: OrderModeStoreSlugCompletePageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <OrderModeStoreSlugComplete />;
};

export default OrderModeStoreSlugCompletePage;
