import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrdersCashDrawer from ".";
import CashDrawerSessions from "./CashDrawerSessions";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  cashDrawerSessionFilterFieldValues,
  cashDrawerSessionSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getCashDrawerSessionEnumOptions } from "@/utils/enumOptions";
import { getCashDrawerSessions, getCurrentCashDrawer } from "@/utils/orders";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

interface OrdersCashDrawerPageProps {
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
}: OrdersCashDrawerPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrders = await getTranslations({ locale, namespace: "orders" });

  return { title: tOrders("cashDrawer.label") };
};

const OrdersCashDrawerPage = async ({
  params,
  searchParams,
}: OrdersCashDrawerPageProps) => {
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

  const memberRole = await getMemberRole(selectedOrganization.id);

  const canViewSessions = hasRolePermission(memberRole, {
    cashDrawer: ["read"],
    revenue: ["read"],
  });

  const grid = resolveGridSearchParams({
    searchParams: rawSearchParams,
    sortFields: cashDrawerSessionSortFieldValues,
    filterFields: cashDrawerSessionFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (grid.redirectParams)
    redirect({
      href: `/orders/cash-drawer?${grid.redirectParams.toString()}`,
      locale,
    });

  const quickFilterEnums = grid.quickFilterValue
    ? getQuickFilterEnums(
        grid.quickFilterValue,
        getCashDrawerSessionEnumOptions(
          await getTranslations({ locale, namespace: "orders" }),
        ),
      )
    : [];

  const [current, sessions] = await Promise.all([
    getCurrentCashDrawer(selectedOrganization.slug, fetchOptions),
    canViewSessions &&
      getCashDrawerSessions(
        selectedOrganization.slug,
        {
          page: grid.page,
          pageSize: grid.pageSize,
          filterField: grid.filterField,
          filterOperator: grid.filterOperator,
          filterValue: grid.filterValue,
          quickFilterEnums,
          quickFilterValue: grid.quickFilterValue,
          sortBy: grid.sortBy,
          sortDirection: grid.sortDirection,
        },
        fetchOptions,
      ),
  ]);

  return (
    <>
      <OrdersCashDrawer current={current} organization={selectedOrganization} />
      {sessions && (
        <CashDrawerSessions
          currency={selectedOrganization.currency}
          filterField={grid.filterField}
          filterOperator={grid.filterOperator}
          filterValue={grid.filterValue}
          organizationSlug={selectedOrganization.slug}
          page={grid.page}
          pageSize={grid.pageSize}
          quickFilterValue={grid.quickFilterValue}
          rowCount={sessions.total}
          rows={sessions.sessions}
          sortBy={grid.sortBy}
          sortDirection={grid.sortDirection}
        />
      )}
    </>
  );
};

export default OrdersCashDrawerPage;
