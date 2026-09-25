import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import HolidaySubstitutes from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceHolidaySubstituteFilterFieldValues,
  attendanceHolidaySubstituteSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceHolidaySubstitutes,
} from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { hasRolePermission } from "@/utils/organizations";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface HolidaySubstitutesPageProps {
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
    year?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: HolidaySubstitutesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("holidaySubstitutes.label") };
};

const HolidaySubstitutesPage = async ({
  params,
  searchParams,
}: HolidaySubstitutesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const access = await getAttendanceAccess(
    rawSearchParams.organization,
    cookieStore.toString(),
  );

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { shift: ["read"] })) notFound();

  const currentYear = dayjs().tz(STORE_TIMEZONE).year();
  const year = Number(rawSearchParams.year);
  const resolvedYear =
    Number.isInteger(year) && year >= 2000 && year <= 2099 ? year : currentYear;

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
    sortFields: attendanceHolidaySubstituteSortFieldValues,
    filterFields: attendanceHolidaySubstituteFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/schedule/holiday-substitutes?${redirectParams.toString()}`,
      locale,
    });

  const { substitutes: rows, total: rowCount } =
    await getAttendanceHolidaySubstitutes(
      organization.slug,
      resolvedYear,
      {
        page,
        pageSize,
        filterField,
        filterOperator,
        filterValue,
        quickFilterValue,
        sortBy,
        sortDirection,
      },
      { headers: { cookie: cookieStore.toString() } },
    );

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <HolidaySubstitutes
        canUpdate={hasRolePermission(memberRole, { shift: ["update"] })}
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
        year={resolvedYear}
      />
    </AttendanceTabsLayout>
  );
};

export default HolidaySubstitutesPage;
