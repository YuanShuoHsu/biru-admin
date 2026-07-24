import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import OrdersBoard from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getResolvedAdminOrganization } from "@/utils/menus";
import { getAdminOrders } from "@/utils/orders";

import OrdersTabsLayout from "../OrdersTabsLayout";

interface OrdersBoardPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

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
    fetchOptions,
  );

  if (!selectedOrganization) return <OrdersTabsLayout>{null}</OrdersTabsLayout>;

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/orders/board?${params.toString()}`, locale });
  }

  const [{ orders: activeOrders }, { orders: deliveredOrders }] =
    await Promise.all([
      getAdminOrders(
        selectedOrganization.slug,
        {
          filterField: "orderStatus",
          filterOperator: "isAnyOf",
          filterValue: "OrderProcessing,OrderPickupAvailable",
          pageSize: 1000,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        fetchOptions,
      ),
      getAdminOrders(
        selectedOrganization.slug,
        {
          filterField: "orderStatus",
          filterOperator: "isAnyOf",
          filterValue: "OrderDelivered",
          pageSize: 100,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        fetchOptions,
      ),
    ]);

  return (
    <OrdersTabsLayout>
      <OrdersBoard
        orders={[...activeOrders, ...deliveredOrders]}
        organization={selectedOrganization}
      />
    </OrdersTabsLayout>
  );
};

export default OrdersBoardPage;
