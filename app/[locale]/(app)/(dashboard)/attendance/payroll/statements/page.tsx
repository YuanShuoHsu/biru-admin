import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Payroll from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  payrollStatementFilterFieldValues,
  payrollStatementSortFieldValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceEmployees,
  getPayrollStatements,
  getPayrollEarningTypes,
  getPayrollTerms,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getPayrollStatementEnumOptions } from "@/utils/enumOptions";
import { hasRolePermission } from "@/utils/organizations";

interface PayrollPageProps {
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
}: PayrollPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("payslips.label") };
};

const PayrollPage = async ({ params, searchParams }: PayrollPageProps) => {
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

  if (
    !hasRolePermission(memberRole, { payrollTerm: ["read"], payslip: ["read"] })
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
    sortFields: payrollStatementSortFieldValues,
    filterFields: payrollStatementFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/payroll/statements?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getPayrollStatementEnumOptions(tAttendance),
      )
    : [];

  const [
    { statements: rows, total: rowCount },
    { employees },
    terms,
    { earningTypes },
  ] = await Promise.all([
    getPayrollStatements(
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
    getAttendanceEmployees(
      organization.slug,
      { pageSize: MAX_PAGE_SIZE },
      fetchOptions,
    ),
    getPayrollTerms(organization.slug, fetchOptions),
    getPayrollEarningTypes(
      organization.slug,
      { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
      fetchOptions,
    ),
  ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Payroll
        canCreate={hasRolePermission(memberRole, { payslip: ["create"] })}
        canViewCosts={hasRolePermission(memberRole, { payslip: ["read"] })}
        canManage={hasRolePermission(memberRole, { payslip: ["update"] })}
        canManageTerms={hasRolePermission(memberRole, {
          payrollTerm: ["create", "update"],
        })}
        earningTypes={earningTypes}
        employees={employees}
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
        terms={terms}
      />
    </AttendanceTabsLayout>
  );
};

export default PayrollPage;
