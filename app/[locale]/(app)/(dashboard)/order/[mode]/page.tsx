import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrderModePickupStoreSlugSelect from "@/components/OrderModePickupStoreSlugSelect";

import { ORDER_MODE } from "@/constants/orderMode";

import type { Locale } from "@/i18n/routing";

import type { OrderMode } from "@/types/orderMode";
import type { StoreSlug } from "@/types/stores";

interface OrderModePageProps {
  params: Promise<{ locale: Locale; mode: OrderMode; storeSlug: StoreSlug }>;
}

const OrderModePage = async ({ params }: OrderModePageProps) => {
  const { locale, mode, storeSlug } = await params;

  setRequestLocale(locale);

  if (mode !== ORDER_MODE.Pickup) return notFound();

  return <OrderModePickupStoreSlugSelect mode={mode} storeSlug={storeSlug} />;
};

export default OrderModePage;
