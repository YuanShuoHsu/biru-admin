import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Calendar from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  ATTENDANCE_CALENDAR_VIEWS,
  attendanceCalendarDate,
  attendanceCalendarRange,
  getAttendanceAccess,
  getAttendanceCalendarDayKinds,
  getAttendanceCalendarLeaves,
  getAttendanceCalendarShifts,
  getAttendanceEmployees,
  SCHEDULABLE_EMPLOYEES_QUERY,
  getAttendanceTemplates,
} from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";

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

  setRequestLocale(locale);

  const access = await getAttendanceAccess(
    organizationSlug,
    cookieStore.toString(),
  );

  if (!access) notFound();

  const { memberRole, organization } = access;

  const date = attendanceCalendarDate(dateParam);

  const view =
    ATTENDANCE_CALENDAR_VIEWS.find((value) => value === viewParam) ?? "week";

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

  const [shifts, dayKinds, leaves, { employees }, { templates }] =
    await Promise.all([
      getAttendanceCalendarShifts(organization.slug, from, to, fetchOptions),
      getAttendanceCalendarDayKinds(organization.slug, from, to, fetchOptions),
      canReadLeaves
        ? getAttendanceCalendarLeaves(organization.slug, from, to, fetchOptions)
        : [],
      getAttendanceEmployees(
        organization.slug,
        SCHEDULABLE_EMPLOYEES_QUERY,
        fetchOptions,
      ),
      hasRolePermission(memberRole, { shiftTemplate: ["read"] })
        ? getAttendanceTemplates(
            organization.slug,
            { pageSize: MAX_PAGE_SIZE },
            fetchOptions,
          )
        : { templates: [] },
    ]);

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Calendar
        canCreate={hasRolePermission(memberRole, { shift: ["create"] })}
        canReadLeaves={canReadLeaves}
        canUpdate={hasRolePermission(memberRole, { shift: ["update"] })}
        dayKinds={dayKinds}
        employees={employees}
        leaves={leaves}
        organization={organization}
        shifts={shifts}
        templates={templates}
        date={date}
        view={view}
      />
    </AttendanceTabsLayout>
  );
};

export default CalendarPage;
