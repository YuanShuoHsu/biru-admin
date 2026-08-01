import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

import type { Locale } from "@/i18n/routing";

import { buildMetadata } from "@/utils/metadata";

interface OrderModePageProps {
  params: Promise<{ locale: Locale; mode: string }>;
}

export const generateMetadata = async ({
  params,
}: OrderModePageProps): Promise<Metadata> => {
  const { locale, mode } = await params;
  if (mode !== ORDER_MODE.Pickup) return {};

  const t = await getTranslations({ locale });

  return buildMetadata({
    description: t("metadata.order.description"),
    locale,
    pathname: `/order/${ORDER_MODE.Pickup}`,
    title: t("order.mode.pickup.label"),
  });
};

const OrderModePage = async ({ params }: OrderModePageProps) => {
  const { mode } = await params;

  if (mode !== ORDER_MODE.Pickup) return notFound();

  return null;
};

export default OrderModePage;
