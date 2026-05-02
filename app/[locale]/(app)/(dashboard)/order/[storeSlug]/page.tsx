import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrderMenuContent from "@/components/OrderMenuContent";
import OrderModeDineInStoreSlugTableNumberSelect from "@/components/OrderModeDineInStoreSlugTableNumberSelect";

import { ORDER_MODE } from "@/constants/orderMode";
import { PARTY_SIZE_MAX } from "@/constants/partySize";

import type { Locale } from "@/i18n/routing";

import type { StoreSlug } from "@/types/stores";

interface OrderStoreSlugPageProps {
  params: Promise<{ locale: Locale; storeSlug: StoreSlug }>;
  searchParams: Promise<{
    mode?: string;
    tableNumber?: string;
    partySize?: string;
  }>;
}

const OrderStoreSlugPage = async ({
  params,
  searchParams,
}: OrderStoreSlugPageProps) => {
  const [{ locale, storeSlug }, { mode, tableNumber, partySize }] =
    await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  if (mode === ORDER_MODE.Pickup) return <OrderMenuContent />;

  if (mode !== ORDER_MODE.DineIn) return notFound();

  const isValidTableNumber = !!tableNumber && /^[1-9]\d*$/.test(tableNumber);

  if (!isValidTableNumber) return notFound();

  if (!partySize) {
    return (
      <OrderModeDineInStoreSlugTableNumberSelect
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

export default OrderStoreSlugPage;
