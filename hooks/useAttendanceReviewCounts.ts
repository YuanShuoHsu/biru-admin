"use client";

import useSWR from "swr";

import type { AttendanceReviewCounts } from "@/types/attendance";
import type { NavBadge } from "@/types/navItem";

import { attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const REFRESH_INTERVAL_MS = 60_000;

export const attendanceReviewCountsKey = (organizationSlug: string) =>
  attendancePath(organizationSlug, "org", "review-counts");

export const sumReviewCountBadges = (
  badges: (NavBadge | undefined)[],
): NavBadge =>
  badges.includes("!")
    ? "!"
    : badges.reduce<number>(
        (sum, badge) => sum + (typeof badge === "number" ? badge : 0),
        0,
      );

export const useAttendanceReviewCounts = (
  organizationSlug: string,
): Record<string, NavBadge> => {
  const { data, error } = useSWR(
    organizationSlug ? attendanceReviewCountsKey(organizationSlug) : null,
    (key: string) => fetcher<AttendanceReviewCounts>(key),
    { refreshInterval: REFRESH_INTERVAL_MS },
  );

  const count = (value?: number): NavBadge =>
    error && !data ? "!" : (value ?? 0);

  return {
    "/attendance/schedule/shifts": count(data?.extraWork),
    "/attendance/schedule/holiday-substitutes": count(data?.holidaySubstitutes),
    "/attendance/schedule/reviews": count(data?.requests),
    "/attendance/leave/parental-returns": count(data?.parentalReturns),
    "/attendance/settings/employees": count(data?.workPermits),
  };
};
