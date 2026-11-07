// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import LeaveCases from "../../../LeaveCases";

import ErrorAlert from "@/components/ErrorAlert";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveCaseFilterFieldValues,
  attendanceLeaveCaseSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceContext,
  AttendanceEmployeeSummary,
  AttendanceLeaveCase,
  AttendanceLeaveCaseFilterField,
  AttendanceLeaveCaseSortField,
  AttendanceLeaveType,
  AttendanceParentalChild,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceContext,
  getAttendanceEmployees,
  getAttendanceLeaveCases,
  getAttendanceLeaveTypes,
  getAttendanceParentalChildren,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeNameEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface LeaveCasesPageProps {
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
}: LeaveCasesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("leaveCases.label") };
};

interface LeaveCasesContentProps {
  canAssignChild: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  canViewAuditLog: boolean;
  canWrite: boolean;
  context: Promise<FetchResult<AttendanceContext>>;
  filterField?: AttendanceLeaveCaseFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  results: Promise<
    [
      FetchResult<{ leaveCases: AttendanceLeaveCase[]; total: number }>,
      FetchResult<{ employees: AttendanceEmployeeSummary[]; total: number }>,
      FetchResult<{ leaveTypes: AttendanceLeaveType[]; total: number }>,
      FetchResult<{
        parentalChildren: AttendanceParentalChild[];
        total: number;
      }>,
    ]
  >;
  sortBy?: AttendanceLeaveCaseSortField;
  sortDirection?: SortDirection;
}

const LeaveCasesContent = async ({
  context: contextResult,
  results,
  ...props
}: LeaveCasesContentProps) => {
  const { data: context, error: contextError } = await contextResult;
  if (contextError) return <ErrorAlert />;

  const { employee, selfReviewAllowed } = context;

  const [
    { data: leaveCases, error },
    { data: employeePage, error: employeesError },
    { data: leaveTypePage, error: leaveTypesError },
    { data: parentalChildPage, error: parentalChildrenError },
  ] = await results;
  if (error || employeesError || leaveTypesError || parentalChildrenError)
    return <ErrorAlert />;

  const { leaveCases: rows, total: rowCount } = leaveCases;
  const { employees } = employeePage;
  const { leaveTypes } = leaveTypePage;
  const { parentalChildren } = parentalChildPage;

  return (
    <LeaveCases
      {...props}
      canReviewOwn={selfReviewAllowed.leaveCase}
      canViewAll
      employeeId={employee?.id}
      employees={employees}
      key={props.organization.slug}
      leaveTypes={leaveTypes}
      parentalChildren={parentalChildren}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const LeaveCasesPage = async ({
  params,
  searchParams,
}: LeaveCasesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { leaveCase: ["read"] })) notFound();

  const canViewAllParentalChildren = hasRolePermission(memberRole, {
    parentalChild: ["read"],
  });
  const canWrite = hasRolePermission(memberRole, { leaveCase: ["create"] });

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
    sortFields: attendanceLeaveCaseSortFieldValues,
    filterFields: attendanceLeaveCaseFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/leave/cases?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceLeaveTypeNameEnumOptions(tAttendance),
      )
    : [];

  const context = settle(getAttendanceContext(organization.slug, fetchOptions));

  const results = context.then(({ data }) =>
    Promise.all([
      settle(
        getAttendanceLeaveCases(
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
        canWrite
          ? getAttendanceEmployees(
              organization.slug,
              { pageSize: MAX_PAGE_SIZE },
              fetchOptions,
            )
          : Promise.resolve({ employees: [], total: 0 }),
      ),
      settle(
        getAttendanceLeaveTypes(
          organization.slug,
          { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
          fetchOptions,
        ),
      ),
      settle(
        canViewAllParentalChildren || data?.employee
          ? getAttendanceParentalChildren(
              organization.slug,
              canViewAllParentalChildren ? "org" : "me",
              { pageSize: MAX_PAGE_SIZE },
              fetchOptions,
            )
          : Promise.resolve({ parentalChildren: [], total: 0 }),
      ),
    ]),
  );

  return (
    <Suspense fallback={<LeaveCases canViewAll loading />}>
      <LeaveCasesContent
        canAssignChild={hasRolePermission(memberRole, {
          leaveCase: ["update"],
        })}
        canDelete={hasRolePermission(memberRole, { leaveCase: ["delete"] })}
        canUpdate={hasRolePermission(memberRole, { leaveCase: ["update"] })}
        canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
        canWrite={canWrite}
        context={context}
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

export default LeaveCasesPage;
