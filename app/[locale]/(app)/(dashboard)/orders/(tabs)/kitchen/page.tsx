import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrdersKitchen from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import { getAdminKitchenOrders } from "@/utils/orders";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

interface OrdersKitchenPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: OrdersKitchenPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrders = await getTranslations({ locale, namespace: "orders" });

  return { title: tOrders("kitchen.title") };
};

const OrdersKitchenPage = async ({
  params,
  searchParams,
}: OrdersKitchenPageProps) => {
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

    redirect({ href: `/orders/kitchen?${params.toString()}`, locale });
  }

  const [{ data: orders, error }, memberRole, session] = await Promise.all([
    settle(getAdminKitchenOrders(selectedOrganization.slug, fetchOptions)),
    getMemberRole(selectedOrganization.id),
    getSession(),
  ]);
  if (error) return <ErrorAlert />;

  return (
    <OrdersKitchen
      canUpdateOrders={
        session?.user?.role === "admin" ||
        hasRolePermission(memberRole, { order: ["update"] })
      }
      orders={orders}
      organization={selectedOrganization}
    />
  );
};

export default OrdersKitchenPage;
