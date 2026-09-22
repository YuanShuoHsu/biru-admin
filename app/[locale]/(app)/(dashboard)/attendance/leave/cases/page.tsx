import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import LeaveCases from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveCaseFilterFieldValues,
  attendanceLeaveCaseSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceContext,
  getAttendanceEmployees,
  getAttendanceLeaveCases,
  getAttendanceLeaveTypes,
  getAttendanceParentalChildren,
} from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { hasRolePermission } from "@/utils/organizations";

interface LeaveCasesPageProps {
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
}: LeaveCasesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("leaveCases.label") };
};

const LeaveCasesPage = async ({
  params,
  searchParams,
}: LeaveCasesPageProps) => {
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

  const canViewAll = hasRolePermission(memberRole, { leaveCase: ["read"] });
  const canViewAllParentalChildren = hasRolePermission(memberRole, {
    parentalChild: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, { leaveCase: ["create"] });

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
    sortFields: attendanceLeaveCaseSortFieldValues,
    filterFields: attendanceLeaveCaseFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/leave/cases?${redirectParams.toString()}`,
      locale,
    });

  const [
    { leaveCases: rows, total: rowCount },
    { employees },
    { leaveTypes },
    { parentalChildren },
    { employee },
  ] = await Promise.all([
    getAttendanceLeaveCases(
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
    getAttendanceLeaveTypes(
      organization.slug,
      { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
      fetchOptions,
    ),
    getAttendanceParentalChildren(
      organization.slug,
      canViewAllParentalChildren ? "org" : "me",
      { pageSize: MAX_PAGE_SIZE },
      fetchOptions,
    ),
    getAttendanceContext(organization.slug, fetchOptions),
  ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <LeaveCases
        canDelete={hasRolePermission(memberRole, { leaveCase: ["delete"] })}
        canUpdate={hasRolePermission(memberRole, { leaveCase: ["update"] })}
        canAssignChild={hasRolePermission(memberRole, {
          leaveCase: ["update"],
        })}
        canSetDailyPay={hasRolePermission(memberRole, {
          payrollTerm: ["update"],
        })}
        canViewAll={canViewAll}
        canWrite={canWrite}
        currency={organization.currency ?? ""}
        employeeId={employee?.id}
        employees={employees}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        leaveTypes={leaveTypes}
        organizationSlug={organization.slug}
        page={page}
        pageSize={pageSize}
        parentalChildren={parentalChildren}
        quickFilterValue={quickFilterValue}
        rowCount={rowCount}
        rows={rows}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </AttendanceTabsLayout>
  );
};

export default LeaveCasesPage;
