import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Mine from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceShiftFilterFieldValues,
  attendanceShiftSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceContext,
  getAttendanceLeaveCases,
  getAttendanceLeaveTypes,
  getAttendancePunchableShifts,
  getAttendanceShifts,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceDayKindEnumOptions } from "@/utils/enumOptions";

interface MinePageProps {
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
}: MinePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("mine.label") };
};

const MinePage = async ({ params, searchParams }: MinePageProps) => {
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
    sortFields: attendanceShiftSortFieldValues,
    filterFields: attendanceShiftFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/shifts?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceDayKindEnumOptions(tAttendance),
      )
    : [];

  const { employee } = await getAttendanceContext(
    organization.slug,
    fetchOptions,
  );

  const enabled = employee?.status === "active";

  const [
    { shifts: rows, total: rowCount },
    punchableShifts,
    { leaveTypes },
    { leaveCases },
  ] = enabled
    ? await Promise.all([
        getAttendanceShifts(
          organization.slug,
          "me",
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
        getAttendancePunchableShifts(organization.slug, fetchOptions),
        getAttendanceLeaveTypes(
          organization.slug,
          { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
          fetchOptions,
        ),
        getAttendanceLeaveCases(
          organization.slug,
          "me",
          { pageSize: MAX_PAGE_SIZE },
          fetchOptions,
        ),
      ])
    : [{ shifts: [], total: 0 }, [], { leaveTypes: [] }, { leaveCases: [] }];

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Mine
        enabled={enabled}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        leaveCases={leaveCases}
        leaveTypes={leaveTypes}
        organization={organization}
        page={page}
        pageSize={pageSize}
        punchableShifts={punchableShifts}
        quickFilterValue={quickFilterValue}
        rowCount={rowCount}
        rows={rows}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </AttendanceTabsLayout>
  );
};

export default MinePage;
