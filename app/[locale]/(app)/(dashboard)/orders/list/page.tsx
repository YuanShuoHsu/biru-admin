import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Orders from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  orderFilterFieldValues,
  orderSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getOrderEnumOptions } from "@/utils/enumOptions";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
import { getAdminOrders } from "@/utils/orders";

import OrdersTabsLayout from "../OrdersTabsLayout";

interface OrdersPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterEnums?: string | string[];
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: OrdersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("orders.list.label") };
};

const OrdersPage = async ({ params, searchParams }: OrdersPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
    cookieStore.toString(),
  );

  if (!selectedOrganization) return <OrdersTabsLayout>{null}</OrdersTabsLayout>;

  const {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams,
    sortBy,
    sortDirection,
  } = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: orderSortFieldValues,
    filterFields: orderFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({ href: `/orders/list?${redirectParams.toString()}`, locale });

  const [tOrder, tOrders] = await Promise.all([
    getTranslations({ locale, namespace: "order" }),
    getTranslations({ locale, namespace: "orders" }),
  ]);

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getOrderEnumOptions(tOrder, tOrders),
      )
    : [];

  const { data: memberRole } =
    await authClient.organization.getActiveMemberRole({
      query: { organizationId: selectedOrganization.id },
      fetchOptions,
    });
  const canViewAuditLog = hasRolePermission(memberRole?.role, {
    auditLog: ["read"],
  });

  const { orders, total } = await getAdminOrders(
    selectedOrganization.slug,
    {
      page,
      pageSize,
      filterField,
      filterOperator,
      filterValue,
      quickFilterEnums,
      quickFilterValue,
      sortBy,
      sortDirection,
    },
    fetchOptions,
  );

  return (
    <OrdersTabsLayout>
      <Orders
        canViewAuditLog={canViewAuditLog}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        orders={orders}
        organizationSlug={selectedOrganization.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={total}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </OrdersTabsLayout>
  );
};

export default OrdersPage;
