import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import LeaveTypes from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveTypeFilterFieldValues,
  attendanceLeaveTypeSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceLeaveTypes,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import {
  getAttendanceLeaveTypeEnumOptions,
  getAttendanceLeaveTypeNameEnumOptions,
} from "@/utils/enumOptions";
import { hasRolePermission } from "@/utils/organizations";

interface LeaveTypesPageProps {
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
}: LeaveTypesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("leaveTypes.label") };
};

const LeaveTypesPage = async ({
  params,
  searchParams,
}: LeaveTypesPageProps) => {
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

  if (!hasRolePermission(memberRole, { leaveType: ["update"] })) notFound();

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
    sortFields: attendanceLeaveTypeSortFieldValues,
    filterFields: attendanceLeaveTypeFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/settings/leave-types?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, {
        // 名稱欄顯示的是翻譯後的法定名稱，搜尋要連同名稱一起命中，不能只比對規則標籤
        statutoryKind: [
          ...getAttendanceLeaveTypeEnumOptions(tAttendance).statutoryKind,
          ...getAttendanceLeaveTypeNameEnumOptions(tAttendance)
            .leaveTypeStatutoryKind,
        ],
      })
    : [];

  const { leaveTypes: rows, total: rowCount } = await getAttendanceLeaveTypes(
    organization.slug,
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
  );

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <LeaveTypes
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

export default LeaveTypesPage;
