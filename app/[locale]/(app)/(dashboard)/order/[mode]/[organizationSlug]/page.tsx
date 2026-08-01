import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import OrderMenuContent from "@/components/OrderMenuContent";
import OrderPartySizeTextField from "@/components/OrderPartySizeTextField";
import OrderTableNumberChip from "@/components/OrderTableNumberChip";

import { ORDER_MODE } from "@/constants/orderMode";
import { PARTY_SIZE_MAX } from "@/constants/partySize";

import type { Locale } from "@/i18n/routing";

import { Stack } from "@mui/material";

import type { Organization } from "@/types/organizations";

import { buildMetadata } from "@/utils/metadata";
import { getOrganization } from "@/utils/organizations";

interface OrderModeOrganizationSlugPageProps {
  params: Promise<{
    locale: Locale;
    mode: string;
    organizationSlug: Organization["slug"];
  }>;
  searchParams: Promise<{
    partySize?: string;
    tableNumber?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: OrderModeOrganizationSlugPageProps): Promise<Metadata> => {
  const { locale, mode, organizationSlug } = await params;

  const organization = await getOrganization(organizationSlug);
  if (!organization) return {};

  if (mode !== ORDER_MODE.Pickup)
    return { robots: { follow: true, index: false }, title: organization.name };

  const t = await getTranslations({ locale });

  return buildMetadata({
    description: t("metadata.organization.description", {
      name: organization.name,
    }),
    locale,
    pathname: `/order/${ORDER_MODE.Pickup}/${organizationSlug}`,
    title: organization.name,
  });
};

const OrderModeOrganizationSlugPage = async ({
  params,
  searchParams,
}: OrderModeOrganizationSlugPageProps) => {
  const [{ locale, mode, organizationSlug }, { partySize, tableNumber }] =
    await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  if (
    mode === ORDER_MODE.Counter ||
    mode === ORDER_MODE.DriveThru ||
    mode === ORDER_MODE.Pickup
  )
    return <OrderMenuContent />;

  if (mode !== ORDER_MODE.DineIn) return notFound();

  const isValidTableNumber = !!tableNumber && /^[1-9]\d*$/.test(tableNumber);

  if (!isValidTableNumber) return notFound();

  if (!partySize) {
    return (
      <Stack
        direction="row"
        justifyContent={{ sm: "flex-end" }}
        alignItems="center"
        gap={2}
      >
        <OrderTableNumberChip tableNumber={tableNumber} />
        <OrderPartySizeTextField
          organizationSlug={organizationSlug}
          tableNumber={tableNumber}
        />
      </Stack>
    );
  }

  const partySizeNum = Number(partySize);
  const isValidPartySize =
    /^[1-9]\d*$/.test(partySize) &&
    partySizeNum >= 1 &&
    partySizeNum <= PARTY_SIZE_MAX;

  if (!isValidPartySize) return notFound();

  return (
    <>
      <Stack
        direction="row"
        justifyContent={{ sm: "flex-end" }}
        alignItems="center"
        gap={2}
      >
        <OrderTableNumberChip tableNumber={tableNumber} />
        <OrderPartySizeTextField
          organizationSlug={organizationSlug}
          partySize={partySize}
          tableNumber={tableNumber}
        />
      </Stack>
      <OrderMenuContent />
    </>
  );
};

export default OrderModeOrganizationSlugPage;
