import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Balances from "../../../LeaveBalances";
import MyAnnualLeaveNotices from "./MyAnnualLeaveNotices";
import MyLeaveCases from "./MyLeaveCases";
import MyParentalChildren from "./MyParentalChildren";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveBalanceFilterFieldValues,
  attendanceLeaveBalanceSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceLeaveBalances,
  getAttendanceLeaveCases,
  getAttendanceParentalChildren,
  getMyAnnualLeaveNotices,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeNameEnumOptions } from "@/utils/enumOptions";
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

  const [
    { balances: rows, total: rowCount },
    { leaveCases },
    { parentalChildren },
    annualLeaveNotices,
  ] = await Promise.all([
    getAttendanceLeaveBalances(
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
    ),
    getAttendanceLeaveCases(
      organization.slug,
      "me",
      { pageSize: MAX_PAGE_SIZE },
      fetchOptions,
    ),
    getAttendanceParentalChildren(
      organization.slug,
      "me",
      { pageSize: MAX_PAGE_SIZE },
      fetchOptions,
    ),
    getMyAnnualLeaveNotices(organization.slug, fetchOptions),
  ]);

  return (
    <>
      <Balances
        canDefer={false}
        canRevokeDeferral={false}
        canViewAll={false}
        canWrite={false}
        employees={[]}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        leaveTypes={[]}
        organization={organization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        rowCount={rowCount}
        rows={rows}
        sortBy={sortBy}
        sortDirection={sortDirection}
      />
      {!!annualLeaveNotices.length && (
        <MyAnnualLeaveNotices
          currency={organization.currency ?? ""}
          notices={annualLeaveNotices}
        />
      )}
      {!!leaveCases.length && (
        <MyLeaveCases
          leaveCases={leaveCases}
          parentalChildren={parentalChildren}
        />
      )}
      {!!parentalChildren.length && (
        <MyParentalChildren parentalChildren={parentalChildren} />
      )}
    </>
  );
};

export default MyLeavePage;
