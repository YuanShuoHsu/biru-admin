"use client";

import RouteTabs from "@/components/RouteTabs";

import { attendanceNavPaths } from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";

interface AttendanceTabsLayoutProps {
  children: React.ReactNode;
  memberRole: Parameters<typeof hasRolePermission>[0];
}

const AttendanceTabsLayout = ({
  children,
  memberRole,
}: AttendanceTabsLayoutProps) => (
  <>
    <RouteTabs
      ariaLabel="attendance tabs"
      tabs={attendanceNavPaths(memberRole).map((path) => ({ path }))}
    />
    {children}
  </>
);

export default AttendanceTabsLayout;
