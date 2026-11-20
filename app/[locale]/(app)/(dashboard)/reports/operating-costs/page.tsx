// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import OperatingCosts from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  operatingCostFilterFieldValues,
  operatingCostSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";
import type {
  OperatingCostFilterField,
  OperatingCostListResponse,
  OperatingCostSortField,
} from "@/types/reports";

import {
  getGridSearchParams,
  getQuickFilterEnums,
  resolveGridSearchParams,
} from "@/utils/dataGrid";
import { getOperatingCostEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, fetcher, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

interface OperatingCostsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: OperatingCostsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tReports = await getTranslations({ locale, namespace: "reports" });

  return { title: tReports("operatingCosts.label") };
};

interface OperatingCostsContentProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: OperatingCostFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  operatingCosts: Promise<FetchResult<OperatingCostListResponse>>;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: OperatingCostSortField;
  sortDirection?: SortDirection;
}

const OperatingCostsContent = async ({
  operatingCosts: operatingCostsResult,
  ...props
}: OperatingCostsContentProps) => {
  const { data, error } = await operatingCostsResult;
  if (error) return <ErrorAlert />;

  return (
    <OperatingCosts
      {...props}
      key={props.organization.slug}
      rowCount={data.total}
      rows={data.data}
    />
  );
};

const OperatingCostsPage = async ({
  params,
  searchParams,
}: OperatingCostsPageProps) => {
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

  if (!isAdmin && !hasRolePermission(memberRole, { operatingCost: ["read"] }))
    notFound();

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
    sortFields: operatingCostSortFieldValues,
    filterFields: operatingCostFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/reports/operating-costs?${redirectParams.toString()}`,
      locale,
    });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getOperatingCostEnumOptions(
          await getTranslations({ locale, namespace: "reports" }),
        ),
      )
    : [];

  const operatingCosts = settle(
    fetcher<OperatingCostListResponse>(
      `/api/organizations/${organization.slug}/operating-costs?${getGridSearchParams(
        {
          filterField,
          filterOperator,
          filterValue,
          page,
          pageSize,
          quickFilterEnums,
          quickFilterValue,
          sortBy,
          sortDirection,
        },
      ).toString()}`,
      {
        headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
      },
    ),
  );

  return (
    <Suspense fallback={<OperatingCosts loading />}>
      <OperatingCostsContent
        canViewAuditLog={
          isAdmin || hasRolePermission(memberRole, { auditLog: ["read"] })
        }
        canWrite={
          isAdmin ||
          hasRolePermission(memberRole, { operatingCost: ["update"] })
        }
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        operatingCosts={operatingCosts}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default OperatingCostsPage;
