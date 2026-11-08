// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Reviews from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceRequestFilterFieldValues,
  attendanceRequestSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceContext,
  AttendanceEmployeeSummary,
  AttendanceLeaveType,
  AttendanceRequest,
  AttendanceRequestFilterField,
  AttendanceRequestSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceContext,
  getAttendanceEmployees,
  getAttendanceLeaveTypes,
  getAttendanceRequests,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  getAttendanceLeaveTypeNameEnumOptions,
  getAttendanceRequestEnumOptions,
} from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface ReviewsPageProps {
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
}: ReviewsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("reviews.label") };
};

interface ReviewsContentProps {
  canGrantLeaveCase: boolean;
  canReview: boolean;
  canViewAuditLog: boolean;
  filterField?: AttendanceRequestFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  results: Promise<
    [
      FetchResult<{ requests: AttendanceRequest[]; total: number }>,
      FetchResult<{ leaveTypes: AttendanceLeaveType[]; total: number }>,
      FetchResult<AttendanceContext>,
      FetchResult<{ employees: AttendanceEmployeeSummary[]; total: number }>,
    ]
  >;
  sortBy?: AttendanceRequestSortField;
  sortDirection?: SortDirection;
}

const ReviewsContent = async ({ results, ...props }: ReviewsContentProps) => {
  const [
    { data: requests, error },
    { data: leaveTypePage, error: leaveTypesError },
    { data: context, error: contextError },
    { data: employeePage, error: employeesError },
  ] = await results;
  if (error || leaveTypesError || contextError || employeesError)
    return <ErrorAlert />;

  const { requests: rows, total: rowCount } = requests;
  const { leaveTypes } = leaveTypePage;
  const { employee, selfReviewAllowed } = context;
  const { employees } = employeePage;

  return (
    <Reviews
      {...props}
      canReviewOwn={selfReviewAllowed.attendanceRequest}
      employeeId={employee?.id}
      employees={employees}
      key={props.organization.slug}
      leaveTypes={leaveTypes}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const ReviewsPage = async ({ params, searchParams }: ReviewsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { attendanceRequest: ["read"] }))
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
    sortFields: attendanceRequestSortFieldValues,
    filterFields: attendanceRequestFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/schedule/reviews?${redirectParams.toString()}`,
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

  const results = Promise.all([
    settle(
      getAttendanceRequests(
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
      getAttendanceLeaveTypes(
        organization.slug,
        { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
        fetchOptions,
      ),
    ),
    settle(getAttendanceContext(organization.slug, fetchOptions)),
    settle(
      getAttendanceEmployees(
        organization.slug,
        { pageSize: MAX_PAGE_SIZE },
        fetchOptions,
      ),
    ),
  ]);

  return (
    <Suspense fallback={<Reviews loading />}>
      <ReviewsContent
        canGrantLeaveCase={hasRolePermission(memberRole, {
          leaveCase: ["create"],
        })}
        canReview={hasRolePermission(memberRole, {
          attendanceRequest: ["update"],
        })}
        canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
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

export default ReviewsPage;
