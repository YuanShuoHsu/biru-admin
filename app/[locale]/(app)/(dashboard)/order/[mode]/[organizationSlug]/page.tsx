import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrderMenuContent from "@/components/OrderMenuContent";
import OrderModeDineInStoreSlugTableNumberSelect from "@/components/OrderModeDineInStoreSlugTableNumberSelect";

import { ORDER_MODE } from "@/constants/orderMode";
import { PARTY_SIZE_MAX } from "@/constants/partySize";

import type { Locale } from "@/i18n/routing";

import type { Organization } from "@/types/organizations";

interface OrderModeOrganizationSlugPageProps {
  params: Promise<{
    locale: Locale;
    mode: string;
    organizationSlug: Organization["slug"];
  }>;
  searchParams: Promise<{
    tableNumber?: string;
    partySize?: string;
  }>;
}

const OrderModeOrganizationSlugPage = async ({
  params,
  searchParams,
}: OrderModeOrganizationSlugPageProps) => {
  const [{ locale, mode, organizationSlug }, { tableNumber, partySize }] =
    await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  if (mode === ORDER_MODE.Pickup) return <OrderMenuContent />;

  if (mode !== ORDER_MODE.DineIn) return notFound();

  const isValidTableNumber = !!tableNumber && /^[1-9]\d*$/.test(tableNumber);

  if (!isValidTableNumber) return notFound();

  if (!partySize) {
    return (
      <OrderModeDineInStoreSlugTableNumberSelect
        organizationSlug={organizationSlug}
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

export default OrderModeOrganizationSlugPage;
