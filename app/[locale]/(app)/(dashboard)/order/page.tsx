import { setRequestLocale } from "next-intl/server";

import Order from ".";

import type { Locale } from "@/i18n/routing";

interface OrderPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrderPage = async ({ params }: OrderPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <Order />;
};

export default OrderPage;
