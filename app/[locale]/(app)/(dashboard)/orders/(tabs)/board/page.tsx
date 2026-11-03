import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrdersBoard from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import { getAdminOrderBoard } from "@/utils/orders";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

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
  if (!selectedOrganization) notFound();

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/orders/board?${params.toString()}`, locale });
  }

  const [{ data: columns, error }, memberRole, session] = await Promise.all([
    settle(getAdminOrderBoard(selectedOrganization.slug, fetchOptions)),
    getMemberRole(selectedOrganization.id),
    getSession(),
  ]);
  if (error) return <ErrorAlert />;

  const isAdmin = session?.user?.role === "admin";

  return (
    <OrdersBoard
      canCreateRefund={
        isAdmin || hasRolePermission(memberRole, { refund: ["create"] })
      }
      canVoidInvoices={
        isAdmin || hasRolePermission(memberRole, { invoice: ["void"] })
      }
      columns={columns}
      organization={selectedOrganization}
    />
  );
};

export default OrdersBoardPage;
