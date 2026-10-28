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

import {
  getAttendanceContext,
  getAttendanceParentalChildren,
} from "@/utils/attendance";
import { resolveGridSearchParams } from "@/utils/dataGrid";
import { settle } from "@/utils/fetcher";
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

const MyChildrenContent = async ({
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

  const { data: context, error: contextError } = await settle(
    getAttendanceContext(organization.slug, fetchOptions),
  );
  if (contextError) return <ErrorAlert />;

  const { employee } = context;

  const { data: parentalChildren, error } = await settle(
    employee
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
  );
  if (error) return <ErrorAlert />;

  const { parentalChildren: rows, total: rowCount } = parentalChildren;

  return (
    <MyChildren
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

const MyChildrenPage = (props: MyChildrenPageProps) => (
  <Suspense fallback={<MyChildren loading />}>
    <MyChildrenContent {...props} />
  </Suspense>
);

export default MyChildrenPage;
