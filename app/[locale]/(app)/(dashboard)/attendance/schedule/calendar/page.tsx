import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Calendar from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import { MAX_PAGE_SIZE } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  getAttendanceAccess,
  getAttendanceCalendarShifts,
  getAttendanceEmployees,
  getAttendanceTemplates,
  weekStart,
} from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface CalendarPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string; week?: string }>;
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
  const [cookieStore, { locale }, { organization: organizationSlug, week }] =
    await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const access = await getAttendanceAccess(
    organizationSlug,
    cookieStore.toString(),
  );

  if (!access) notFound();

  const { memberRole, organization } = access;

  const start = weekStart(week);

  if (organizationSlug !== organization.slug || week !== start) {
    const params = new URLSearchParams({
      organization: organization.slug,
      week: start,
    });

    redirect({
      href: `/attendance/schedule/calendar?${params.toString()}`,
      locale,
    });
  }

  if (!hasRolePermission(memberRole, { shift: ["read"] })) notFound();

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const from = dayjs.tz(start, STORE_TIMEZONE).toISOString();
  const to = dayjs.tz(start, STORE_TIMEZONE).add(7, "day").toISOString();

  const [shifts, { employees }, { templates }] = await Promise.all([
    getAttendanceCalendarShifts(organization.slug, from, to, fetchOptions),
    getAttendanceEmployees(
      organization.slug,
      { pageSize: MAX_PAGE_SIZE },
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
        canCancel={hasRolePermission(memberRole, { shift: ["update"] })}
        canCreate={hasRolePermission(memberRole, { shift: ["create"] })}
        employees={employees}
        organizationSlug={organization.slug}
        shifts={shifts}
        templates={templates}
        week={start}
      />
    </AttendanceTabsLayout>
  );
};

export default CalendarPage;
