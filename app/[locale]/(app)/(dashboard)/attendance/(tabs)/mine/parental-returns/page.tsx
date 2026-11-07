// https://nextjs.org/docs/app/guides/streaming#status-codes

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
import type {
  AttendanceContext,
  AttendanceParentalReturn,
  AttendanceParentalReturnFilterField,
  AttendanceParentalReturnSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceContext,
  getAttendanceParentalReturns,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceParentalReturnEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
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

interface MyParentalReturnsContentProps {
  filterField?: AttendanceParentalReturnFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  results: Promise<
    | {
        employee: AttendanceContext["employee"];
        parentalReturns: FetchResult<{
          parentalReturns: AttendanceParentalReturn[];
          total: number;
        }>;
      }
    | undefined
  >;
  sortBy?: AttendanceParentalReturnSortField;
  sortDirection?: SortDirection;
}

const MyParentalReturnsContent = async ({
  results,
  ...props
}: MyParentalReturnsContentProps) => {
  const result = await results;
  if (!result) return <ErrorAlert />;

  const { employee } = result;

  const { data: parentalReturns, error } = result.parentalReturns;
  if (error) return <ErrorAlert />;

  const { parentalReturns: rows, total: rowCount } = parentalReturns;

  return (
    <ParentalReturns
      {...props}
      canReview={false}
      canReviewOwn={false}
      canViewAll={false}
      employeeId={employee?.id}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const MyParentalReturnsPage = async ({
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

  const results = settle(
    getAttendanceContext(organization.slug, fetchOptions),
  ).then(async ({ data: context }) => {
    if (!context) return;

    const { employee } = context;

    return {
      employee,
      parentalReturns: await settle(
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
      ),
    };
  });

  return (
    <Suspense fallback={<ParentalReturns loading />}>
      <MyParentalReturnsContent
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

export default MyParentalReturnsPage;
