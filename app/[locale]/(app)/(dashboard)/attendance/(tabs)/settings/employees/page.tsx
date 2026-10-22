import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Employees from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceEmployeeFilterFieldValues,
  attendanceEmployeeSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceContext,
  getAttendanceLegalStatusObligations,
  getAttendanceMembers,
  getPayrollTerms,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceEmployeeEnumOptions } from "@/utils/enumOptions";
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

const EmployeesContent = async ({
  params,
  searchParams,
}: EmployeesPageProps) => {
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

  const [
    { members: rows, total: rowCount },
    legalStatusObligations,
    terms,
    context,
  ] = await Promise.all([
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
    getAttendanceLegalStatusObligations(organization.slug, fetchOptions),
    canManageTerms ? getPayrollTerms(organization.slug, fetchOptions) : [],
    canManageChildren
      ? getAttendanceContext(organization.slug, fetchOptions)
      : null,
  ]);

  return (
    <Employees
      canDelete={hasRolePermission(memberRole, { employee: ["delete"] })}
      canDeleteChildren={hasRolePermission(memberRole, {
        parentalChild: ["delete"],
      })}
      canManageChildren={canManageChildren}
      canUpdateChildren={hasRolePermission(memberRole, {
        parentalChild: ["update"],
      })}
      canViewAuditLog={hasRolePermission(memberRole, { auditLog: ["read"] })}
      canReviewOwnChildren={!!context?.selfReviewAllowed.parentalChild}
      canManageTaxIdentity={hasRolePermission(memberRole, {
        payrollTerm: ["update"],
      })}
      canManageTerms={canManageTerms}
      canWrite={hasRolePermission(memberRole, {
        employee: ["create", "update"],
      })}
      employeeId={context?.employee?.id}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      legalStatusObligations={legalStatusObligations}
      organization={organization}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
      terms={terms}
    />
  );
};

const EmployeesPage = (props: EmployeesPageProps) => (
  <Suspense fallback={<Employees loading />}>
    <EmployeesContent {...props} />
  </Suspense>
);

export default EmployeesPage;
