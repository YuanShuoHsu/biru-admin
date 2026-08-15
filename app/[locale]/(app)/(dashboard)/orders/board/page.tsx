import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import OrdersBoard from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getResolvedAdminOrganization } from "@/utils/menus";
import { getAdminOrderBoard } from "@/utils/orders";

import OrdersTabsLayout from "../OrdersTabsLayout";

interface OrdersBoardPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: OrdersBoardPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("orders.board.title") };
};

const OrdersBoardPage = async ({
  params,
  searchParams,
}: OrdersBoardPageProps) => {
  const [cookieStore, { locale }, { organization }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(
    organization,
    cookieStore.toString(),
  );

  if (!selectedOrganization) return <OrdersTabsLayout>{null}</OrdersTabsLayout>;

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/orders/board?${params.toString()}`, locale });
  }

  const columns = await getAdminOrderBoard(
    selectedOrganization.slug,
    fetchOptions,
  );

  return (
    <OrdersTabsLayout>
      <OrdersBoard columns={columns} organization={selectedOrganization} />
    </OrdersTabsLayout>
  );
};

export default OrdersBoardPage;
