// https://nextjs.org/docs/app/guides/streaming#status-codes

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import HolidaySubstitutes from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceHolidaySubstituteFilterFieldValues,
  attendanceHolidaySubstituteSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceHolidaySubstitute,
  AttendanceHolidaySubstituteFilterField,
  AttendanceHolidaySubstituteSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getAttendanceHolidaySubstitutes } from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

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

interface HolidaySubstitutesContentProps {
  canUpdate: boolean;
  canViewAuditLog: boolean;
  filterField?: AttendanceHolidaySubstituteFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: AttendanceHolidaySubstituteSortField;
  sortDirection?: SortDirection;
  substitutes: Promise<
    FetchResult<{ substitutes: AttendanceHolidaySubstitute[]; total: number }>
  >;
  year: number;
}

const HolidaySubstitutesContent = async ({
  substitutes: substitutesResult,
  ...props
}: HolidaySubstitutesContentProps) => {
  const { data: substitutes, error } = await substitutesResult;
  if (error) return <ErrorAlert />;

  const { substitutes: rows, total: rowCount } = substitutes;

  return (
    <HolidaySubstitutes
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
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

  const access = await getAttendanceAccess(rawSearchParams.organization);

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

  const substitutes = settle(
    getAttendanceHolidaySubstitutes(
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
    ),
  );

  return (
    <Suspense fallback={<HolidaySubstitutes loading />}>
      <HolidaySubstitutesContent
        canUpdate={hasRolePermission(memberRole, { shift: ["update"] })}
        canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
        substitutes={substitutes}
        year={resolvedYear}
      />
    </Suspense>
  );
};

export default HolidaySubstitutesPage;
