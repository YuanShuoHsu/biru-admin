import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import ParentalReturns from "../../../ParentalReturns";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceParentalReturnFilterFieldValues,
  attendanceParentalReturnSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceContext,
  getAttendanceParentalReturns,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceParentalReturnEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
import { getAttendanceAccess } from "@/utils/session";

interface MyMyParentalReturnsPageProps {
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
}: MyMyParentalReturnsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("parentalReturns.label") };
};

const MyParentalReturnsContent = async ({
  params,
  searchParams,
}: MyMyParentalReturnsPageProps) => {
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
    sortFields: attendanceParentalReturnSortFieldValues,
    filterFields: attendanceParentalReturnFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/parental-returns?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceParentalReturnEnumOptions(tAttendance),
      )
    : [];

  const { data: context, error: contextError } = await settle(
    getAttendanceContext(organization.slug, fetchOptions),
  );
  if (contextError) return <ErrorAlert />;

  const { employee } = context;

  const { data: parentalReturns, error } = await settle(
    employee
      ? getAttendanceParentalReturns(
          organization.slug,
          "me",
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
        )
      : Promise.resolve({ parentalReturns: [], total: 0 }),
  );
  if (error) return <ErrorAlert />;

  const { parentalReturns: rows, total: rowCount } = parentalReturns;

  return (
    <ParentalReturns
      canReview={false}
      canReviewOwn={false}
      canViewAll={false}
      employeeId={employee?.id}
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

const MyParentalReturnsPage = (props: MyMyParentalReturnsPageProps) => (
  <Suspense fallback={<ParentalReturns loading />}>
    <MyParentalReturnsContent {...props} />
  </Suspense>
);

export default MyParentalReturnsPage;
