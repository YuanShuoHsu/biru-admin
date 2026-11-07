// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Balances from "../../../LeaveBalances";

import ErrorAlert from "@/components/ErrorAlert";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveBalanceFilterFieldValues,
  attendanceLeaveBalanceSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceEmployeeSummary,
  AttendanceLeaveBalance,
  AttendanceLeaveBalanceFilterField,
  AttendanceLeaveBalanceSortField,
  AttendanceLeaveType,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceEmployees,
  getAttendanceLeaveBalances,
  getAttendanceLeaveTypes,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeNameEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface BalancesPageProps {
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
}: BalancesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("balances.label") };
};

interface BalancesContentProps {
  canDefer: boolean;
  canRevokeDeferral: boolean;
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: AttendanceLeaveBalanceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  results: Promise<
    [
      FetchResult<{ balances: AttendanceLeaveBalance[]; total: number }>,
      FetchResult<{ employees: AttendanceEmployeeSummary[]; total: number }>,
      FetchResult<{ leaveTypes: AttendanceLeaveType[]; total: number }>,
    ]
  >;
  sortBy?: AttendanceLeaveBalanceSortField;
  sortDirection?: SortDirection;
}

const BalancesContent = async ({ results, ...props }: BalancesContentProps) => {
  const [
    { data: balances, error },
    { data: employeePage, error: employeesError },
    { data: leaveTypePage, error: leaveTypesError },
  ] = await results;
  if (error || employeesError || leaveTypesError) return <ErrorAlert />;

  const { balances: rows, total: rowCount } = balances;
  const { employees } = employeePage;
  const { leaveTypes } = leaveTypePage;

  return (
    <Balances
      {...props}
      canViewAll
      employees={employees}
      key={props.organization.slug}
      leaveTypes={leaveTypes.filter(
        ({ statutoryKind }) => statutoryKind === "custom",
      )}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const BalancesPage = async ({ params, searchParams }: BalancesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { leaveBalance: ["read"] })) notFound();

  const canWrite = hasRolePermission(memberRole, {
    leaveBalance: ["create", "update"],
  });
  const canDefer = hasRolePermission(memberRole, {
    leaveBalance: ["create"],
  });
  const canRevokeDeferral = hasRolePermission(memberRole, {
    leaveBalance: ["delete"],
  });

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
    sortFields: attendanceLeaveBalanceSortFieldValues,
    filterFields: attendanceLeaveBalanceFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/leave/balances?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceLeaveTypeNameEnumOptions(tAttendance),
      )
    : [];

  const results = Promise.all([
    settle(
      getAttendanceLeaveBalances(
        organization.slug,
        "org",
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
    ),
    settle(
      canWrite
        ? getAttendanceEmployees(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE },
            fetchOptions,
          )
        : Promise.resolve({ employees: [], total: 0 }),
    ),
    settle(
      canWrite
        ? getAttendanceLeaveTypes(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
            fetchOptions,
          )
        : Promise.resolve({ leaveTypes: [], total: 0 }),
    ),
  ]);

  return (
    <Suspense fallback={<Balances canViewAll loading />}>
      <BalancesContent
        canDefer={canDefer}
        canRevokeDeferral={canRevokeDeferral}
        canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
        canWrite={canWrite}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        results={results}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default BalancesPage;
