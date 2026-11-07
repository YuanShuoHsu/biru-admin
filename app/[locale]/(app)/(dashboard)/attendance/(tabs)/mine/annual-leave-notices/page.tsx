// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AnnualLeaveNotices from "../../../AnnualLeaveNotices";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceAnnualLeaveNoticeFilterFieldValues,
  attendanceAnnualLeaveNoticeSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceAnnualLeaveNotice,
  AttendanceAnnualLeaveNoticeFilterField,
  AttendanceAnnualLeaveNoticeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceAnnualLeaveNotices,
  getAttendanceContext,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceAnnualLeaveNoticeEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getAttendanceAccess } from "@/utils/session";

interface MyAnnualLeaveNoticesPageProps {
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
}: MyAnnualLeaveNoticesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("annualLeaveNotices.label") };
};

interface MyAnnualLeaveNoticesContentProps {
  filterField?: AttendanceAnnualLeaveNoticeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  notices: Promise<
    | FetchResult<{ notices: AttendanceAnnualLeaveNotice[]; total: number }>
    | undefined
  >;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: AttendanceAnnualLeaveNoticeSortField;
  sortDirection?: SortDirection;
}

const MyAnnualLeaveNoticesContent = async ({
  notices: noticesPromise,
  ...props
}: MyAnnualLeaveNoticesContentProps) => {
  const noticesResult = await noticesPromise;
  if (!noticesResult) return <ErrorAlert />;

  const { data: notices, error } = noticesResult;
  if (error) return <ErrorAlert />;

  const { notices: rows, total: rowCount } = notices;

  return (
    <AnnualLeaveNotices
      {...props}
      canViewAll={false}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const MyAnnualLeaveNoticesPage = async ({
  params,
  searchParams,
}: MyAnnualLeaveNoticesPageProps) => {
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
    sortFields: attendanceAnnualLeaveNoticeSortFieldValues,
    filterFields: attendanceAnnualLeaveNoticeFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/annual-leave-notices?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceAnnualLeaveNoticeEnumOptions(tAttendance),
      )
    : [];

  const notices = settle(
    getAttendanceContext(organization.slug, fetchOptions),
  ).then(({ data: context }) =>
    context
      ? settle(
          context.employee
            ? getAttendanceAnnualLeaveNotices(
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
            : Promise.resolve({ notices: [], total: 0 }),
        )
      : undefined,
  );

  return (
    <Suspense fallback={<AnnualLeaveNotices loading />}>
      <MyAnnualLeaveNoticesContent
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        notices={notices}
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

export default MyAnnualLeaveNoticesPage;
