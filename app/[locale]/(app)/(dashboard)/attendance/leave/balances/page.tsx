import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Balances from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveBalanceFilterFieldValues,
  attendanceLeaveBalanceSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceEmployees,
  getAttendanceLeaveBalances,
  getAttendanceLeaveTypes,
} from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { hasRolePermission } from "@/utils/organizations";

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

const BalancesPage = async ({ params, searchParams }: BalancesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(
    rawSearchParams.organization,
    cookieStore.toString(),
  );

  if (!access) notFound();

  const { memberRole, organization } = access;

  const canViewAll = hasRolePermission(memberRole, {
    leaveBalance: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, {
    leaveBalance: ["create", "update"],
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

  const [{ balances: rows, total: rowCount }, { employees }, { leaveTypes }] =
    await Promise.all([
      getAttendanceLeaveBalances(
        organization.slug,
        canViewAll ? "org" : "me",
        {
          page,
          pageSize,
          filterField,
          filterOperator,
          filterValue,
          quickFilterValue,
          sortBy,
          sortDirection,
        },
        fetchOptions,
      ),
      canWrite
        ? getAttendanceEmployees(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE },
            fetchOptions,
          )
        : { employees: [] },
      canWrite
        ? getAttendanceLeaveTypes(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
            fetchOptions,
          )
        : { leaveTypes: [] },
    ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Balances
        canViewAll={canViewAll}
        canWrite={canWrite}
        employees={employees}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        leaveTypes={leaveTypes.filter(
          ({ statutoryKind }) => statutoryKind === "custom",
        )}
        organizationSlug={organization.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={rowCount}
        rows={rows}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </AttendanceTabsLayout>
  );
};

export default BalancesPage;
