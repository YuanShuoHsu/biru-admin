import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Payslips from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  payrollStatementFilterFieldValues,
  payrollStatementSortFieldValues,
} from "@/types/api";

import { getPayrollStatements } from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceAccess } from "@/utils/session";

interface PayslipsPageProps {
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
}: PayslipsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("payslips.label") };
};

const PayslipsContent = async ({ params, searchParams }: PayslipsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { organization } = access;

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
      href: `/attendance/mine/payslips?${redirectParams.toString()}`,
      locale,
    });

  const { statements: rows, total: rowCount } = await getPayrollStatements(
    organization.slug,
    "me",
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
  );

  return (
    <Payslips
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

const PayslipsPage = (props: PayslipsPageProps) => (
  <Suspense fallback={<Payslips loading />}>
    <PayslipsContent {...props} />
  </Suspense>
);

export default PayslipsPage;
