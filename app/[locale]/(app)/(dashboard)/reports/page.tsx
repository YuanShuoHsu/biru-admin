// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Reports from ".";
import {
  getReportPath,
  getReportQuery,
  REPORT_GRID_FIELDS,
  REPORT_TABS,
  type ReportView,
  resolveReportView,
  toReportGridQuery,
} from "./definitions";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { filterOperatorValues } from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";
import type {
  InventoryReportResponse,
  PersonnelCostReportResponse,
  SalesReportResponse,
} from "@/types/reports";

import {
  getGridSearchParams,
  getQuickFilterEnums,
  resolveGridSearchParams,
} from "@/utils/dataGrid";
import { getIngredientEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, fetcher, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

interface ReportsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    groupBy?: string;
    month?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterEnums?: string | string[];
    quickFilterValue?: string;
    since?: string;
    sortBy?: string;
    sortDirection?: string;
    tab?: string;
    until?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: ReportsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tReports = await getTranslations({ locale, namespace: "reports" });

  return { title: tReports("label") };
};

interface ReportsContentProps {
  canViewInventory: boolean;
  canViewPersonnel: boolean;
  canViewSales: boolean;
  canViewWastedCost: boolean;
  filterField?: string;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  reports: Promise<
    [
      FetchResult<SalesReportResponse | undefined>,
      FetchResult<InventoryReportResponse | undefined>,
      FetchResult<PersonnelCostReportResponse | undefined>,
    ]
  >;
  sortBy?: string;
  sortDirection?: SortDirection;
  view: ReportView;
}

const ReportsContent = async ({ reports, ...props }: ReportsContentProps) => {
  const [salesResult, inventoryResult, personnelResult] = await reports;

  if (salesResult.error || inventoryResult.error || personnelResult.error)
    return <ErrorAlert />;

  return (
    <Reports
      {...props}
      inventory={inventoryResult.data}
      key={props.organization.slug}
      personnel={personnelResult.data}
      sales={salesResult.data}
    />
  );
};

const ReportsPage = async ({ params, searchParams }: ReportsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const [organization, session] = await Promise.all([
    getResolvedAdminOrganization(rawSearchParams.organization),
    getSession(),
  ]);

  if (!organization) notFound();

  const isAdmin = session?.user?.role === "admin";
  const memberRole = await getMemberRole(organization.id);

  const canViewSales =
    isAdmin || hasRolePermission(memberRole, { revenue: ["read"] });
  const canViewInventory =
    isAdmin ||
    hasRolePermission(memberRole, { inventoryTransaction: ["read"] });

  const canViewPersonnel =
    isAdmin || hasRolePermission(memberRole, { payslip: ["read"] });

  const canViewWastedCost =
    isAdmin || hasRolePermission(memberRole, { purchasing: ["read"] });

  const tabPermissions = {
    inventory: canViewInventory,
    personnel: canViewPersonnel,
    sales: canViewSales,
  };

  const tabs = REPORT_TABS.filter((tab) => tabPermissions[tab]);

  if (!tabs.length) notFound();

  const view = resolveReportView(rawSearchParams, tabs);

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
    ...REPORT_GRID_FIELDS[view.tab],
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  const canonicalParams = new URLSearchParams({
    organization: organization.slug,
    tab: view.tab,
    since: view.since,
    until: view.until,
    groupBy: view.groupBy,
    month: view.month,
  });

  if (
    [...canonicalParams].some(
      ([key, value]) =>
        rawSearchParams[key as keyof typeof rawSearchParams] !== value,
    )
  ) {
    canonicalParams.set("page", "1");
    canonicalParams.set("pageSize", String(pageSize));
    redirect({ href: `/reports?${canonicalParams.toString()}`, locale });
  }

  if (redirectParams)
    redirect({ href: `/reports?${redirectParams.toString()}`, locale });

  const quickFilterEnums =
    view.tab === "inventory" && quickFilterValue
      ? getQuickFilterEnums(
          quickFilterValue,
          getIngredientEnumOptions(
            await getTranslations({ locale, namespace: "inventory" }),
          ),
        )
      : [];

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const reportUrl = `${getReportPath(organization.slug, view.tab)}?${getReportQuery(view)}&${toReportGridQuery(
    view.tab,
    getGridSearchParams({
      filterField,
      filterOperator,
      filterValue,
      page,
      pageSize,
      quickFilterEnums,
      quickFilterValue,
      sortBy,
      sortDirection,
    }),
  )}`;

  const reports = Promise.all([
    settle(
      view.tab === "sales"
        ? fetcher<SalesReportResponse>(reportUrl, fetchOptions)
        : Promise.resolve(undefined),
    ),
    settle(
      view.tab === "inventory"
        ? fetcher<InventoryReportResponse>(reportUrl, fetchOptions)
        : Promise.resolve(undefined),
    ),
    settle(
      view.tab === "personnel"
        ? fetcher<PersonnelCostReportResponse>(reportUrl, fetchOptions)
        : Promise.resolve(undefined),
    ),
  ]);

  const reportsProps = {
    canViewInventory,
    canViewPersonnel,
    canViewSales,
    canViewWastedCost,
    filterField,
    filterOperator,
    filterValue,
    organization,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
    view,
  };

  return (
    <Suspense fallback={<Reports {...reportsProps} loading />}>
      <ReportsContent {...reportsProps} reports={reports} />
    </Suspense>
  );
};

export default ReportsPage;
