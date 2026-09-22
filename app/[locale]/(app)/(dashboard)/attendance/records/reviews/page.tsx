import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Reviews from ".";

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
  getAttendanceLeaveTypes,
  getAttendanceRequests,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceRequestEnumOptions } from "@/utils/enumOptions";
import { hasRolePermission } from "@/utils/organizations";

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

const ReviewsPage = async ({ params, searchParams }: ReviewsPageProps) => {
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
      href: `/attendance/records/reviews?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceRequestEnumOptions(tAttendance),
      )
    : [];

  const [{ requests: rows, total: rowCount }, { leaveTypes }, { employee }] =
    await Promise.all([
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
      getAttendanceLeaveTypes(
        organization.slug,
        { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
        fetchOptions,
      ),
      getAttendanceContext(organization.slug, fetchOptions),
    ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Reviews
        canReview={hasRolePermission(memberRole, {
          attendanceRequest: ["update"],
        })}
        employeeId={employee?.id}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        leaveTypes={leaveTypes}
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

export default ReviewsPage;
