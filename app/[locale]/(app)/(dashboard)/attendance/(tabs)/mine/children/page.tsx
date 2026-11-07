// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MyChildren from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceParentalChildFilterFieldValues,
  attendanceParentalChildSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceContext,
  AttendanceParentalChild,
  AttendanceParentalChildFilterField,
  AttendanceParentalChildSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceContext,
  getAttendanceParentalChildren,
} from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getAttendanceAccess } from "@/utils/session";

interface MyChildrenPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    quickFilterValue?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: MyChildrenPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("parentalChildren.label") };
};

interface MyChildrenContentProps {
  context: Promise<FetchResult<AttendanceContext>>;
  filterField?: AttendanceParentalChildFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  parentalChildren: Promise<
    FetchResult<{ parentalChildren: AttendanceParentalChild[]; total: number }>
  >;
  quickFilterValue?: string;
  sortBy?: AttendanceParentalChildSortField;
  sortDirection?: SortDirection;
}

const MyChildrenContent = async ({
  context: contextResult,
  parentalChildren: parentalChildrenResult,
  ...props
}: MyChildrenContentProps) => {
  const { error: contextError } = await contextResult;
  if (contextError) return <ErrorAlert />;

  const { data: parentalChildren, error } = await parentalChildrenResult;
  if (error) return <ErrorAlert />;

  const { parentalChildren: rows, total: rowCount } = parentalChildren;

  return (
    <MyChildren
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const MyChildrenPage = async ({
  params,
  searchParams,
}: MyChildrenPageProps) => {
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
    sortFields: attendanceParentalChildSortFieldValues,
    filterFields: attendanceParentalChildFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/children?${redirectParams.toString()}`,
      locale,
    });

  const context = settle(getAttendanceContext(organization.slug, fetchOptions));

  const parentalChildren = context.then(({ data }) =>
    settle(
      data?.employee
        ? getAttendanceParentalChildren(
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
          )
        : Promise.resolve({ parentalChildren: [], total: 0 }),
    ),
  );

  return (
    <Suspense fallback={<MyChildren loading />}>
      <MyChildrenContent
        context={context}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={organization}
        page={page}
        pageSize={pageSize}
        parentalChildren={parentalChildren}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default MyChildrenPage;
