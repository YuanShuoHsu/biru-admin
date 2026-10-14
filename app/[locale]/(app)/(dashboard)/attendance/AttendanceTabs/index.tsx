"use client";

import RouteTabs from "@/components/RouteTabs";

import {
  useSelectedMemberRole,
  useSelectedOrganizationSlug,
} from "@/hooks/organizations";
import { useAttendanceReviewCounts } from "@/hooks/useAttendanceReviewCounts";

import { usePathname } from "@/i18n/navigation";

import { attendanceNavGroups } from "@/utils/attendance";

const AttendanceTabs = () => {
  const memberRole = useSelectedMemberRole();
  const pathname = usePathname();
  const reviewCounts = useAttendanceReviewCounts(useSelectedOrganizationSlug());

  const groups = attendanceNavGroups(memberRole);

  const active =
    groups.find(
      ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
    ) ?? groups[0];

  const tabs = memberRole
    ? (active?.children ?? []).map((path) => ({
        badge: reviewCounts[path],
        path,
      }))
    : [];

  return (
    (memberRole === undefined || tabs.length > 1) && (
      <RouteTabs ariaLabel="attendance tabs" key={active?.path} tabs={tabs} />
    )
  );
};

export default AttendanceTabs;
