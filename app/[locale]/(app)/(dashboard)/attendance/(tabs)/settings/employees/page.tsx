// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Employees from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceEmployeeFilterFieldValues,
  attendanceEmployeeSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceContext,
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField,
  AttendanceLegalStatusObligation,
  AttendanceMember,
  PayrollTerms,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceContext,
  getAttendanceLegalStatusObligations,
  getAttendanceMembers,
  getPayrollTerms,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceEmployeeEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface EmployeesPageProps {
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
}: EmployeesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("employees.label") };
};

interface EmployeesContentProps {
  canDelete: boolean;
  canDeleteChildren: boolean;
  canManageChildren: boolean;
  canManageTaxIdentity: boolean;
  canManageTerms: boolean;
  canUpdateChildren: boolean;
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: AttendanceEmployeeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  results: Promise<
    [
      FetchResult<{ members: AttendanceMember[]; total: number }>,
      FetchResult<AttendanceLegalStatusObligation[]>,
      FetchResult<PayrollTerms[]>,
      FetchResult<AttendanceContext | null>,
    ]
  >;
  sortBy?: AttendanceEmployeeSortField;
  sortDirection?: SortDirection;
}

const EmployeesContent = async ({
  results,
  ...props
}: EmployeesContentProps) => {
  const [
    { data: members, error },
    { data: legalStatusObligations, error: legalStatusObligationsError },
    { data: terms, error: termsError },
    { data: context, error: contextError },
  ] = await results;
  if (error || legalStatusObligationsError || termsError || contextError)
    return <ErrorAlert />;

  const { members: rows, total: rowCount } = members;

  return (
    <Employees
      {...props}
      canReviewOwnChildren={!!context?.selfReviewAllowed.parentalChild}
      employeeId={context?.employee?.id}
      key={props.organization.slug}
      legalStatusObligations={legalStatusObligations}
      rowCount={rowCount}
      rows={rows}
      terms={terms}
    />
  );
};

const EmployeesPage = async ({ params, searchParams }: EmployeesPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { employee: ["read"] })) notFound();

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
    sortFields: attendanceEmployeeSortFieldValues,
    filterFields: attendanceEmployeeFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/settings/employees?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceEmployeeEnumOptions(tAttendance),
      )
    : [];

  const canManageTerms = hasRolePermission(memberRole, {
    payrollTerm: ["create", "read", "update"],
  });

  const canManageChildren = hasRolePermission(memberRole, {
    parentalChild: ["create", "read"],
  });

  const results = Promise.all([
    settle(
      getAttendanceMembers(
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
      ),
    ),
    settle(
      getAttendanceLegalStatusObligations(organization.slug, fetchOptions),
    ),
    settle(
      canManageTerms
        ? getPayrollTerms(organization.slug, fetchOptions)
        : Promise.resolve([]),
    ),
    settle(
      canManageChildren
        ? getAttendanceContext(organization.slug, fetchOptions)
        : Promise.resolve(null),
    ),
  ]);

  return (
    <Suspense fallback={<Employees loading />}>
      <EmployeesContent
        canDelete={hasRolePermission(memberRole, { employee: ["delete"] })}
        canDeleteChildren={hasRolePermission(memberRole, {
          parentalChild: ["delete"],
        })}
        canManageChildren={canManageChildren}
        canManageTaxIdentity={hasRolePermission(memberRole, {
          payrollTerm: ["update"],
        })}
        canManageTerms={canManageTerms}
        canUpdateChildren={hasRolePermission(memberRole, {
          parentalChild: ["update"],
        })}
        canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
        canWrite={hasRolePermission(memberRole, {
          employee: ["create", "update"],
        })}
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

export default EmployeesPage;
