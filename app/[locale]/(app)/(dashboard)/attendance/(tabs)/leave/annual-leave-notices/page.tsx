import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AnnualLeaveNotices from "../../../AnnualLeaveNotices";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceAnnualLeaveNoticeFilterFieldValues,
  attendanceAnnualLeaveNoticeSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import { getAttendanceAnnualLeaveNotices } from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceAnnualLeaveNoticeEnumOptions } from "@/utils/enumOptions";
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

const AnnualLeaveNoticesContent = async ({
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

  const { notices: rows, total: rowCount } =
    await getAttendanceAnnualLeaveNotices(
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
    );

  return (
    <AnnualLeaveNotices
      canViewAll
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

const AnnualLeaveNoticesPage = (props: AnnualLeaveNoticesPageProps) => (
  <Suspense fallback={<AnnualLeaveNotices canViewAll loading />}>
    <AnnualLeaveNoticesContent {...props} />
  </Suspense>
);

export default AnnualLeaveNoticesPage;
