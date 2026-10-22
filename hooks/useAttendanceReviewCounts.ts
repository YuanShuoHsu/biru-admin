"use client";

import useSWR from "swr";

import type { AttendanceReviewCounts } from "@/types/attendance";

import { attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const REFRESH_INTERVAL_MS = 60_000;

export const attendanceReviewCountsKey = (organizationSlug: string) =>
  attendancePath(organizationSlug, "org", "review-counts");

export const useAttendanceReviewCounts = (
  organizationSlug: string,
): Record<string, number> => {
  const { data } = useSWR(
    organizationSlug ? attendanceReviewCountsKey(organizationSlug) : null,
    (key: string) => fetcher<AttendanceReviewCounts>(key),
    { refreshInterval: REFRESH_INTERVAL_MS },
  );

  return {
    "/attendance/schedule/shifts": data?.extraWork ?? 0,
    "/attendance/schedule/holiday-substitutes": data?.holidaySubstitutes ?? 0,
    "/attendance/schedule/reviews": data?.requests ?? 0,
    "/attendance/leave/parental-returns": data?.parentalReturns ?? 0,
    "/attendance/settings/employees": data?.workPermits ?? 0,
  };
};
