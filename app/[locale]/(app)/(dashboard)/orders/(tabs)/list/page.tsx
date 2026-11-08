// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Orders from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  orderFilterFieldValues,
  orderSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  AdminOrderResponse,
  OrderFilterField,
  OrderSortField,
} from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getOrderEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getAdminOrders } from "@/utils/orders";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

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
  const tOrders = await getTranslations({ locale, namespace: "orders" });

  return { title: tOrders("list.label") };
};

interface OrdersContentProps {
  canCreateRefund: boolean;
  canViewAuditLog: boolean;
  canVoidInvoices: boolean;
  filterField?: OrderFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  orders: Promise<FetchResult<{ orders: AdminOrderResponse[]; total: number }>>;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: OrderSortField;
  sortDirection?: SortDirection;
}

const OrdersContent = async ({
  orders: ordersResult,
  ...props
}: OrdersContentProps) => {
  const { data: orders, error } = await ordersResult;
  if (error) return <ErrorAlert />;

  const { orders: rows, total: rowCount } = orders;

  return (
    <Orders
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const OrdersPage = async ({ params, searchParams }: OrdersPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

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

  const [memberRole, session] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    getSession(),
  ]);
  const isAdmin = session?.user?.role === "admin";
  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canCreateRefund =
    isAdmin || hasRolePermission(memberRole, { refund: ["create"] });
  const canVoidInvoices =
    isAdmin || hasRolePermission(memberRole, { invoice: ["void"] });

  const orders = settle(
    getAdminOrders(
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
    ),
  );

  return (
    <Suspense fallback={<Orders loading />}>
      <OrdersContent
        canCreateRefund={canCreateRefund}
        canViewAuditLog={canViewAuditLog}
        canVoidInvoices={canVoidInvoices}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        orders={orders}
        organization={selectedOrganization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default OrdersPage;
