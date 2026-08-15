import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Orders from ".";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  orderFilterFieldValues,
  orderSortFieldValues,
  sortDirectionValues,
} from "@/types/api";

import { getQuickFilterEnums } from "@/utils/dataGrid";
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
  const [
    cookieStore,
    { locale },
    {
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      organization,
      page: rawPage,
      pageSize: rawPageSize,
      quickFilterEnums: rawQuickFilterEnums,
      quickFilterValue,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
      ...restSearchParams
    },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  const sortBy = orderSortFieldValues.find((field) => field === rawSortBy);
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = orderFilterFieldValues.find(
    (field) => field === rawFilterField,
  );
  const filterOperator = filterOperatorValues.find(
    (operator) => operator === rawFilterOperator,
  );

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(
    organization,
    cookieStore.toString(),
  );

  if (!selectedOrganization) return <OrdersTabsLayout>{null}</OrdersTabsLayout>;

  if (
    rawQuickFilterEnums !== undefined ||
    organization !== selectedOrganization.slug ||
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection ||
    !!sortBy !== !!sortDirection ||
    rawFilterField !== filterField ||
    rawFilterOperator !== filterOperator ||
    !!(filterField || filterOperator || filterValue) !==
      !!(
        filterField &&
        filterOperator &&
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator))
      )
  ) {
    const params = new URLSearchParams({
      ...restSearchParams,
      organization: selectedOrganization.slug,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator)) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });

    redirect({ href: `/orders/list?${params.toString()}`, locale });
  }

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
