// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import ShiftTypes from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceShiftTypeFilterFieldValues,
  attendanceShiftTypeSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceShiftType,
  AttendanceShiftTypeFilterField,
  AttendanceShiftTypeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getAttendanceShiftTypes } from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface ShiftTypesPageProps {
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
}: ShiftTypesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("shiftTypes.label") };
};

interface ShiftTypesContentProps {
  canViewAuditLog: boolean;
  filterField?: AttendanceShiftTypeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  shiftTypes: Promise<
    FetchResult<{ shiftTypes: AttendanceShiftType[]; total: number }>
  >;
  sortBy?: AttendanceShiftTypeSortField;
  sortDirection?: SortDirection;
}

const ShiftTypesContent = async ({
  shiftTypes: shiftTypesResult,
  ...props
}: ShiftTypesContentProps) => {
  const { data: shiftTypes, error } = await shiftTypesResult;
  if (error) return <ErrorAlert />;

  const { shiftTypes: rows, total: rowCount } = shiftTypes;

  return (
    <ShiftTypes
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const ShiftTypesPage = async ({
  params,
  searchParams,
}: ShiftTypesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { shiftType: ["create"] })) notFound();

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
    sortFields: attendanceShiftTypeSortFieldValues,
    filterFields: attendanceShiftTypeFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/schedule/shift-types?${redirectParams.toString()}`,
      locale,
    });

  const shiftTypes = settle(
    getAttendanceShiftTypes(
      organization.slug,
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
      fetchOptions,
    ),
  );

  return (
    <Suspense fallback={<ShiftTypes loading />}>
      <ShiftTypesContent
        canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        shiftTypes={shiftTypes}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default ShiftTypesPage;
