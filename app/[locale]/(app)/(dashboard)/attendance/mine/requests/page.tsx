import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Requests from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceRequestFilterFieldValues,
  attendanceRequestSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceContext,
  getAttendanceLeaveCases,
  getAttendanceLeaveTypes,
  getAttendanceRequests,
  getAttendanceShifts,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  getAttendanceLeaveTypeNameEnumOptions,
  getAttendanceRequestEnumOptions,
} from "@/utils/enumOptions";

interface RequestsPageProps {
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
}: RequestsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("requests.label") };
};

const RequestsPage = async ({ params, searchParams }: RequestsPageProps) => {
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
    sortFields: attendanceRequestSortFieldValues,
    filterFields: attendanceRequestFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/requests?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, {
        ...getAttendanceRequestEnumOptions(tAttendance),
        ...getAttendanceLeaveTypeNameEnumOptions(tAttendance),
      })
    : [];

  const { employee } = await getAttendanceContext(
    organization.slug,
    fetchOptions,
  );

  const enabled = employee?.status === "active";

  const [
    { requests: rows, total: rowCount },
    { leaveTypes },
    { leaveCases },
    { shifts },
  ] = await Promise.all([
    enabled
      ? getAttendanceRequests(
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
        )
      : { requests: [], total: 0 },
    enabled
      ? getAttendanceLeaveTypes(
          organization.slug,
          { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
          fetchOptions,
        )
      : { leaveTypes: [] },
    enabled
      ? getAttendanceLeaveCases(
          organization.slug,
          "me",
          { pageSize: MAX_PAGE_SIZE },
          fetchOptions,
        )
      : { leaveCases: [] },
    enabled
      ? getAttendanceShifts(
          organization.slug,
          "me",
          { pageSize: MAX_PAGE_SIZE },
          fetchOptions,
        )
      : { shifts: [] },
  ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Requests
        enabled={enabled}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        leaveCases={leaveCases}
        leaveTypes={leaveTypes}
        organizationSlug={organization.slug}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={rowCount}
        rows={rows}
        shifts={shifts}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </AttendanceTabsLayout>
  );
};

export default RequestsPage;
