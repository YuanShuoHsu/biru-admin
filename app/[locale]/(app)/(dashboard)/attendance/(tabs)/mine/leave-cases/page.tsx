import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import LeaveCases from "../../../LeaveCases";

import ErrorAlert from "@/components/ErrorAlert";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceLeaveCaseFilterFieldValues,
  attendanceLeaveCaseSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceContext,
  getAttendanceLeaveCases,
  getAttendanceLeaveTypes,
  getAttendanceParentalChildren,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeNameEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
import { getAttendanceAccess } from "@/utils/session";

interface MyLeaveCasesPageProps {
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
}: MyLeaveCasesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("leaveCases.label") };
};

const MyLeaveCasesContent = async ({
  params,
  searchParams,
}: MyLeaveCasesPageProps) => {
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
    sortFields: attendanceLeaveCaseSortFieldValues,
    filterFields: attendanceLeaveCaseFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/mine/leave-cases?${redirectParams.toString()}`,
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

  const { data: context, error: contextError } = await settle(
    getAttendanceContext(organization.slug, fetchOptions),
  );
  if (contextError) return <ErrorAlert />;

  const { employee } = context;

  const [
    { data: leaveCases, error },
    { data: leaveTypePage, error: leaveTypesError },
    { data: parentalChildPage, error: parentalChildrenError },
  ] = await Promise.all([
    settle(
      employee
        ? getAttendanceLeaveCases(
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
        : Promise.resolve({ leaveCases: [], total: 0 }),
    ),
    settle(
      getAttendanceLeaveTypes(
        organization.slug,
        { pageSize: MAX_PAGE_SIZE, sortDirection: "asc" },
        fetchOptions,
      ),
    ),
    settle(
      employee
        ? getAttendanceParentalChildren(
            organization.slug,
            "me",
            { pageSize: MAX_PAGE_SIZE },
            fetchOptions,
          )
        : Promise.resolve({ parentalChildren: [], total: 0 }),
    ),
  ]);
  if (error || leaveTypesError || parentalChildrenError) return <ErrorAlert />;

  const { leaveCases: rows, total: rowCount } = leaveCases;
  const { leaveTypes } = leaveTypePage;
  const { parentalChildren } = parentalChildPage;

  return (
    <LeaveCases
      canAssignChild={false}
      canDelete={false}
      canReviewOwn={false}
      canUpdate={false}
      canViewAll={false}
      canWrite={false}
      employees={[]}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      leaveTypes={leaveTypes}
      organization={organization}
      page={page}
      pageSize={pageSize}
      parentalChildren={parentalChildren}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const MyLeaveCasesPage = (props: MyLeaveCasesPageProps) => (
  <Suspense fallback={<LeaveCases loading />}>
    <MyLeaveCasesContent {...props} />
  </Suspense>
);

export default MyLeaveCasesPage;
