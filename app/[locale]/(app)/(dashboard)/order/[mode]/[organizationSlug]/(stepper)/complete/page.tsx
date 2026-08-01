import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";

import type { Locale } from "@/i18n/routing";

import type { OrderResponse } from "@/types/orders";
import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

import OrderModeOrganizationSlugComplete from ".";

interface OrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ locale: Locale; mode: string; organizationSlug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export const generateMetadata = async ({
  params,
}: OrderModeOrganizationSlugCompletePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("order.mode.storeSlug.tableNumber.stepper.complete.label"),
  };
};

const OrderModeOrganizationSlugCompletePage = async ({
  params,
  searchParams,
}: OrderModeOrganizationSlugCompletePageProps) => {
  const { locale, organizationSlug } = await params;
  const { orderId } = await searchParams;

  setRequestLocale(locale);

  const reqHeaders = await headers();

  const [order, organization] = await Promise.all([
    orderId
      ? fetcher<OrderResponse>(
          `/api/organizations/${organizationSlug}/orders/${orderId}`,
          { headers: { cookie: reqHeaders.get("cookie") || "" } },
        ).catch(() => null)
      : null,
    fetcher<OrganizationResponse>(
      `/api/organizations/${organizationSlug}`,
    ).catch(() => null),
  ]);

  return (
    <OrderModeOrganizationSlugComplete
      order={order}
      organization={organization}
    />
  );
};

export default OrderModeOrganizationSlugCompletePage;
