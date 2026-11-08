// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Balances from "../../../LeaveBalances";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveBalanceFilterFieldValues,
  attendanceLeaveBalanceSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type {
  AttendanceLeaveBalance,
  AttendanceLeaveBalanceFilterField,
  AttendanceLeaveBalanceSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getAttendanceContext,
  getAttendanceLeaveBalances,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeNameEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { getAttendanceAccess } from "@/utils/session";

interface MyLeavePageProps {
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
}: MyLeavePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("balances.label") };
};

interface MyLeaveContentProps {
  balances: Promise<
    | FetchResult<{ balances: AttendanceLeaveBalance[]; total: number }>
    | undefined
  >;
  filterField?: AttendanceLeaveBalanceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: AttendanceLeaveBalanceSortField;
  sortDirection?: SortDirection;
}

const MyLeaveContent = async ({
  balances: balancesPromise,
  ...props
}: MyLeaveContentProps) => {
  const balancesResult = await balancesPromise;
  if (!balancesResult) return <ErrorAlert />;

  const { data: balances, error } = balancesResult;
  if (error) return <ErrorAlert />;

  const { balances: rows, total: rowCount } = balances;

  return (
    <Balances
      {...props}
      canDefer={false}
      canRevokeDeferral={false}
      canViewAll={false}
      canWrite={false}
      employees={[]}
      key={props.organization.slug}
      leaveTypes={[]}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const MyLeavePage = async ({ params, searchParams }: MyLeavePageProps) => {
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
    sortFields: attendanceLeaveBalanceSortFieldValues,
    filterFields: attendanceLeaveBalanceFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/leave?${redirectParams.toString()}`,
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

  const balances = settle(
    getAttendanceContext(organization.slug, fetchOptions),
  ).then(({ data: context }) =>
    context
      ? settle(
          context.employee
            ? getAttendanceLeaveBalances(
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
            : Promise.resolve({ balances: [], total: 0 }),
        )
      : undefined,
  );

  return (
    <Suspense fallback={<Balances loading />}>
      <MyLeaveContent
        balances={balances}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
};

export default MyLeavePage;
