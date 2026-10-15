import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import OrdersBoard from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getAdminOrderBoard } from "@/utils/orders";
import { getResolvedAdminOrganization } from "@/utils/session";

interface OrdersBoardPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: OrdersBoardPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrders = await getTranslations({ locale, namespace: "orders" });

  return { title: tOrders("board.title") };
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

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(organization);

  if (!selectedOrganization) return null;

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

  return <OrdersBoard columns={columns} organization={selectedOrganization} />;
};

export default OrdersBoardPage;
