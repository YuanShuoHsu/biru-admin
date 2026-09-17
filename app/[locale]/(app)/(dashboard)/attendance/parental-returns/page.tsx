import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ParentalReturns from ".";

import AttendanceTabsLayout from "../AttendanceTabsLayout";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceParentalReturnFilterFieldValues,
  attendanceParentalReturnSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceContext,
  getAttendanceParentalReturns,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceParentalReturnEnumOptions } from "@/utils/enumOptions";
import { hasRolePermission } from "@/utils/organizations";

interface ParentalReturnsPageProps {
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
}: ParentalReturnsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("parentalReturns.label") };
};

const ParentalReturnsPage = async ({
  params,
  searchParams,
}: ParentalReturnsPageProps) => {
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
    parentalReturn: ["read"],
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
    sortFields: attendanceParentalReturnSortFieldValues,
    filterFields: attendanceParentalReturnFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/parental-returns?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceParentalReturnEnumOptions(tAttendance),
      )
    : [];

  const [{ parentalReturns: rows, total: rowCount }, { employee }] =
    await Promise.all([
      getAttendanceParentalReturns(
        organization.slug,
        canViewAll ? "all" : "me",
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
      getAttendanceContext(organization.slug, fetchOptions),
    ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <ParentalReturns
        canReview={hasRolePermission(memberRole, {
          parentalReturn: ["update"],
        })}
        canViewAll={canViewAll}
        employeeId={employee?.id}
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

export default ParentalReturnsPage;
