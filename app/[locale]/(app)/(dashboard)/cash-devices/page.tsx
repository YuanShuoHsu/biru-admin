// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import CashDevices from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  cashDeviceFilterFieldValues,
  cashDeviceSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  CashDevice,
  CashDeviceFilterField,
  CashDeviceSortField,
} from "@/types/cashDevices";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getCashDevices } from "@/utils/cashDevices";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getCashDeviceEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";

interface CashDevicesPageProps {
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
}: CashDevicesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tCashDevices = await getTranslations({
    locale,
    namespace: "cashDevices",
  });

  return { title: tCashDevices("label") };
};

interface CashDevicesContentProps {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  cashDevices: Promise<
    FetchResult<{ cashDevices: CashDevice[]; total: number }>
  >;
  filterField?: CashDeviceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: CashDeviceSortField;
  sortDirection?: SortDirection;
}

const CashDevicesContent = async ({
  cashDevices: cashDevicesResult,
  ...props
}: CashDevicesContentProps) => {
  const { data: cashDevices, error: cashDevicesError } =
    await cashDevicesResult;
  if (cashDevicesError) return <ErrorAlert />;

  const { cashDevices: rows, total: rowCount } = cashDevices;

  return (
    <CashDevices
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const CashDevicesPage = async ({
  params,
  searchParams,
}: CashDevicesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };

  const organization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
  );

  if (!organization) notFound();

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
    sortFields: cashDeviceSortFieldValues,
    filterFields: cashDeviceFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/cash-devices?${redirectParams.toString()}`,
      locale,
    });

  const memberRole = await getMemberRole(organization.id);

  if (!hasRolePermission(memberRole, { cashDevice: ["read"] })) notFound();

  const tCashDevices = await getTranslations({
    locale,
    namespace: "cashDevices",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getCashDeviceEnumOptions(tCashDevices),
      )
    : [];

  const cashDevices = settle(
    getCashDevices(
      organization.slug,
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
    <Suspense fallback={<CashDevices loading />}>
      <CashDevicesContent
        canCreate={hasRolePermission(memberRole, { cashDevice: ["create"] })}
        canDelete={hasRolePermission(memberRole, { cashDevice: ["delete"] })}
        canUpdate={hasRolePermission(memberRole, { cashDevice: ["update"] })}
        cashDevices={cashDevices}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
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

export default CashDevicesPage;
