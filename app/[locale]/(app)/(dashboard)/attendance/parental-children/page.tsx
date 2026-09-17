import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ParentalChildren from ".";

import AttendanceTabsLayout from "../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceParentalChildFilterFieldValues,
  attendanceParentalChildSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceContext,
  getAttendanceEmployees,
  getAttendanceParentalChildren,
} from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { hasRolePermission } from "@/utils/organizations";

interface ParentalChildrenPageProps {
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
}: ParentalChildrenPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("parentalChildren.label") };
};

const ParentalChildrenPage = async ({
  params,
  searchParams,
}: ParentalChildrenPageProps) => {
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
    parentalChild: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, {
    parentalChild: ["create"],
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
    sortFields: attendanceParentalChildSortFieldValues,
    filterFields: attendanceParentalChildFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/parental-children?${redirectParams.toString()}`,
      locale,
    });

  const [
    { parentalChildren: rows, total: rowCount },
    { employees },
    { employee },
  ] = await Promise.all([
    getAttendanceParentalChildren(
      organization.slug,
      canViewAll ? "all" : "me",
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
    getAttendanceContext(organization.slug, fetchOptions),
  ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <ParentalChildren
        canViewAll={canViewAll}
        canWrite={canWrite}
        employeeId={employee?.id}
        employees={employees}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
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

export default ParentalChildrenPage;
