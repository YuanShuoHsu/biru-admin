import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrderMenuContent from "@/components/OrderMenuContent";
import OrderModeDineInStoreSlugTableNumberSelect from "@/components/OrderModeDineInStoreSlugTableNumberSelect";

import { ORDER_MODE } from "@/constants/orderMode";
import { PARTY_SIZE_MAX } from "@/constants/partySize";

import type { Locale } from "@/i18n/routing";

import type { OrderMode } from "@/types/orderMode";
import type { StoreSlug } from "@/types/stores";

interface OrderModeStoreSlugPageProps {
  params: Promise<{ locale: Locale; mode: OrderMode; storeSlug: StoreSlug }>;
  searchParams: Promise<{ tableNumber?: string; partySize?: string }>;
}

const OrderModeStoreSlugPage = async ({
  params,
  searchParams,
}: OrderModeStoreSlugPageProps) => {
  const { locale, mode, storeSlug } = await params;

  setRequestLocale(locale);

  if (mode === ORDER_MODE.Pickup) return <OrderMenuContent />;

  const { tableNumber, partySize } = await searchParams;

  const isValidTableNumber = !!tableNumber && /^[1-9]\d*$/.test(tableNumber);

  if (!isValidTableNumber) return notFound();

  if (!partySize) {
    return (
      <OrderModeDineInStoreSlugTableNumberSelect
        mode={mode}
        storeSlug={storeSlug}
        tableNumber={tableNumber}
      />
    );
  }

  const partySizeNum = Number(partySize);
  const isValidPartySize =
    /^[1-9]\d*$/.test(partySize) &&
    partySizeNum >= 1 &&
    partySizeNum <= PARTY_SIZE_MAX;

  if (!isValidPartySize) return notFound();

  return <OrderMenuContent />;
};

export default OrderModeStoreSlugPage;
