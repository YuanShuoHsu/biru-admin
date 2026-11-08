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

import { getAttendanceAnnualLeaveNotices } from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceAnnualLeaveNoticeEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface AnnualLeaveNoticesPageProps {
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
}: AnnualLeaveNoticesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("annualLeaveNotices.label") };
};

interface AnnualLeaveNoticesContentProps {
  filterField?: AttendanceAnnualLeaveNoticeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  notices: Promise<
    FetchResult<{ notices: AttendanceAnnualLeaveNotice[]; total: number }>
  >;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: AttendanceAnnualLeaveNoticeSortField;
  sortDirection?: SortDirection;
}

const AnnualLeaveNoticesContent = async ({
  notices: noticesResult,
  ...props
}: AnnualLeaveNoticesContentProps) => {
  const { data: notices, error } = await noticesResult;
  if (error) return <ErrorAlert />;

  const { notices: rows, total: rowCount } = notices;

  return (
    <AnnualLeaveNotices
      {...props}
      canViewAll
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const AnnualLeaveNoticesPage = async ({
  params,
  searchParams,
}: AnnualLeaveNoticesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (
    !hasRolePermission(memberRole, {
      leaveBalance: ["read"],
      payslip: ["read"],
    })
  )
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
    sortFields: attendanceAnnualLeaveNoticeSortFieldValues,
    filterFields: attendanceAnnualLeaveNoticeFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/leave/annual-leave-notices?${redirectParams.toString()}`,
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
    getAttendanceAnnualLeaveNotices(
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
      { headers: { cookie: cookieStore.toString() } },
    ),
  );

  return (
    <Suspense fallback={<AnnualLeaveNotices canViewAll loading />}>
      <AnnualLeaveNoticesContent
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

export default AnnualLeaveNoticesPage;
