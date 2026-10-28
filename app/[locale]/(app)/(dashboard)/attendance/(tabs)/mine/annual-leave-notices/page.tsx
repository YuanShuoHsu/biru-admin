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

import {
  getAttendanceAnnualLeaveNotices,
  getAttendanceContext,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceAnnualLeaveNoticeEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
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

const MyAnnualLeaveNoticesContent = async ({
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

  const { data: context, error: contextError } = await settle(
    getAttendanceContext(organization.slug, fetchOptions),
  );
  if (contextError) return <ErrorAlert />;

  const { employee } = context;

  const { data: notices, error } = await settle(
    employee
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
  );
  if (error) return <ErrorAlert />;

  const { notices: rows, total: rowCount } = notices;

  return (
    <AnnualLeaveNotices
      canViewAll={false}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
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

const MyAnnualLeaveNoticesPage = (props: MyAnnualLeaveNoticesPageProps) => (
  <Suspense fallback={<AnnualLeaveNotices loading />}>
    <MyAnnualLeaveNoticesContent {...props} />
  </Suspense>
);

export default MyAnnualLeaveNoticesPage;
