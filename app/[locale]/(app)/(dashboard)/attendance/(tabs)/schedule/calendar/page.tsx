import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Calendar from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import {
  ATTENDANCE_CALENDAR_VIEWS,
  attendanceCalendarDate,
  attendanceCalendarRange,
  DEFAULT_ATTENDANCE_CALENDAR_VIEW,
  getAttendanceCalendarDayKinds,
  getAttendanceCalendarLeaves,
  getAttendanceCalendarShifts,
  getAttendanceEmployees,
  getAttendanceShiftTypes,
  getAttendanceTeams,
  SCHEDULABLE_EMPLOYEES_QUERY,
} from "@/utils/attendance";
import { settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface CalendarPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    date?: string;
    organization?: string;
    view?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: CalendarPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("schedule.label") };
};

const CalendarPage = async ({ params, searchParams }: CalendarPageProps) => {
  const [
    cookieStore,
    { locale },
    { date: dateParam, organization: organizationSlug, view: viewParam },
  ] = await Promise.all([cookies(), params, searchParams]);

  const access = await getAttendanceAccess(organizationSlug);

  if (!access) notFound();

  const { memberRole, organization } = access;

  const date = attendanceCalendarDate(dateParam);

  const view =
    ATTENDANCE_CALENDAR_VIEWS.find((value) => value === viewParam) ??
    DEFAULT_ATTENDANCE_CALENDAR_VIEW;

  if (
    organizationSlug !== organization.slug ||
    dateParam !== date ||
    viewParam !== view
  ) {
    const params = new URLSearchParams({
      date,
      organization: organization.slug,
      view,
    });

    redirect({
      href: `/attendance/schedule/calendar?${params.toString()}`,
      locale,
    });
  }

  if (!hasRolePermission(memberRole, { shift: ["read"] })) notFound();

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const range = attendanceCalendarRange(view, date);
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  const canReadLeaves = hasRolePermission(memberRole, {
    attendanceRequest: ["read"],
  });

  const [
    { data: shifts, error: shiftsError },
    { data: dayKinds, error: dayKindsError },
    { data: leaves, error: leavesError },
    { data: employeePage, error: employeesError },
    { data: shiftTypePage, error: shiftTypesError },
    { data: teams, error: teamsError },
  ] = await Promise.all([
    settle(
      getAttendanceCalendarShifts(organization.slug, from, to, fetchOptions),
    ),
    settle(
      getAttendanceCalendarDayKinds(organization.slug, from, to, fetchOptions),
    ),
    settle(
      canReadLeaves
        ? getAttendanceCalendarLeaves(organization.slug, from, to, fetchOptions)
        : Promise.resolve([]),
    ),
    settle(
      getAttendanceEmployees(
        organization.slug,
        SCHEDULABLE_EMPLOYEES_QUERY,
        fetchOptions,
      ),
    ),
    settle(
      getAttendanceShiftTypes(
        organization.slug,
        { pageSize: MAX_PAGE_SIZE },
        fetchOptions,
      ),
    ),
    settle(getAttendanceTeams(organization.slug, fetchOptions)),
  ]);
  if (
    shiftsError ||
    dayKindsError ||
    leavesError ||
    employeesError ||
    shiftTypesError ||
    teamsError
  )
    return <ErrorAlert />;

  const { employees } = employeePage;
  const { shiftTypes } = shiftTypePage;

  return (
    <Calendar
      canCreate={hasRolePermission(memberRole, { shift: ["create"] })}
      canReadLeaves={canReadLeaves}
      canUpdate={hasRolePermission(memberRole, { shift: ["update"] })}
      dayKinds={dayKinds}
      employees={employees}
      leaves={leaves}
      organization={organization}
      shifts={shifts}
      shiftTypes={shiftTypes}
      teams={teams}
      date={date}
      view={view}
    />
  );
};

export default CalendarPage;
