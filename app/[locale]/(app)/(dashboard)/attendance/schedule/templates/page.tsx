import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Templates from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  attendanceTemplateFilterFieldValues,
  attendanceTemplateSortFieldValues,
  filterOperatorValues,
} from "@/types/api";

import {
  getAttendanceAccess,
  getAttendanceEmployees,
  SCHEDULABLE_EMPLOYEES_QUERY,
  getAttendanceTemplates,
} from "@/utils/attendance";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAttendanceDayKindEnumOptions } from "@/utils/enumOptions";
import { hasRolePermission } from "@/utils/organizations";

interface TemplatesPageProps {
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
}: TemplatesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("templates.label") };
};

const TemplatesPage = async ({ params, searchParams }: TemplatesPageProps) => {
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

  if (!hasRolePermission(memberRole, { shiftTemplate: ["read"] })) notFound();

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
    sortFields: attendanceTemplateSortFieldValues,
    filterFields: attendanceTemplateFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: organization.slug,
  });

  if (redirectParams)
    redirect({
      href: `/attendance/schedule/templates?${redirectParams.toString()}`,
      locale,
    });

  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAttendanceDayKindEnumOptions(tAttendance),
      )
    : [];

  const [{ templates: rows, total: rowCount }, { employees }] =
    await Promise.all([
      getAttendanceTemplates(
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
      getAttendanceEmployees(
        organization.slug,
        SCHEDULABLE_EMPLOYEES_QUERY,
        fetchOptions,
      ),
    ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Templates
        canCreate={hasRolePermission(memberRole, {
          shiftTemplate: ["create"],
        })}
        canDelete={hasRolePermission(memberRole, {
          shiftTemplate: ["delete"],
        })}
        canGenerate={hasRolePermission(memberRole, { shift: ["create"] })}
        canUpdate={hasRolePermission(memberRole, {
          shiftTemplate: ["update"],
        })}
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
      />
    </AttendanceTabsLayout>
  );
};

export default TemplatesPage;
