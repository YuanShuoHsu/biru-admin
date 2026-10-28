import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Requests from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceRequestFilterFieldValues,
  attendanceRequestSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceContext,
  getAttendanceLeaveCases,
  getAttendanceLeaveTypes,
  getAttendanceRequests,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  getAttendanceLeaveTypeNameEnumOptions,
  getAttendanceRequestEnumOptions,
} from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
import { getAttendanceAccess } from "@/utils/session";

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

const RequestsContent = async ({ params, searchParams }: RequestsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { organization } = access;

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

  const { data: context, error: contextError } = await settle(
    getAttendanceContext(organization.slug, fetchOptions),
  );
  if (contextError) return <ErrorAlert />;

  const { employee } = context;

  const enabled = employee?.status === "active";

  const [
    { data: requests, error },
    { data: leaveTypePage, error: leaveTypesError },
    { data: leaveCasePage, error: leaveCasesError },
  ] = await Promise.all([
    settle(
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
        : Promise.resolve({ requests: [], total: 0 }),
    ),
    settle(
      enabled
        ? getAttendanceLeaveTypes(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
            fetchOptions,
          )
        : Promise.resolve({ leaveTypes: [], total: 0 }),
    ),
    settle(
      enabled
        ? getAttendanceLeaveCases(
            organization.slug,
            "me",
            { pageSize: MAX_PAGE_SIZE },
            fetchOptions,
          )
        : Promise.resolve({ leaveCases: [], total: 0 }),
    ),
  ]);
  if (error || leaveTypesError || leaveCasesError) return <ErrorAlert />;

  const { requests: rows, total: rowCount } = requests;
  const { leaveTypes } = leaveTypePage;
  const { leaveCases } = leaveCasePage;

  return (
    <Requests
      enabled={enabled}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      leaveCases={leaveCases}
      leaveTypes={leaveTypes}
      organization={organization}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const RequestsPage = (props: RequestsPageProps) => (
  <Suspense fallback={<Requests loading />}>
    <RequestsContent {...props} />
  </Suspense>
);

export default RequestsPage;
