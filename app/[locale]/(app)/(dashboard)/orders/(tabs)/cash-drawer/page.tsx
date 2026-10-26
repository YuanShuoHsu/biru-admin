import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrdersCashDrawer from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getCurrentCashDrawer } from "@/utils/orders";
import { getResolvedAdminOrganization } from "@/utils/session";

interface OrdersCashDrawerPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: OrdersCashDrawerPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrders = await getTranslations({ locale, namespace: "orders" });

  return { title: tOrders("cashDrawer.label") };
};

const OrdersCashDrawerPage = async ({
  params,
  searchParams,
}: OrdersCashDrawerPageProps) => {
  const [cookieStore, { locale }, { organization }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(organization);
  if (!selectedOrganization) notFound();

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/orders/cash-drawer?${params.toString()}`, locale });
  }

  const current = await getCurrentCashDrawer(
    selectedOrganization.slug,
    fetchOptions,
  );

  return (
    <OrdersCashDrawer current={current} organization={selectedOrganization} />
  );
};

export default OrdersCashDrawerPage;
