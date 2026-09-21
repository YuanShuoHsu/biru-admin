"use client";

import RouteTabs from "@/components/RouteTabs";

import { usePathname } from "@/i18n/navigation";

import { attendanceNavGroups } from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";

interface AttendanceTabsLayoutProps {
  children: React.ReactNode;
  memberRole: Parameters<typeof hasRolePermission>[0];
}

const AttendanceTabsLayout = ({
  children,
  memberRole,
}: AttendanceTabsLayoutProps) => {
  const pathname = usePathname();

  const groups = attendanceNavGroups(memberRole);

  const active =
    groups.find(
      ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
    ) ?? groups[0];

  return (
    <>
      {active && active.children.length > 1 && (
        <RouteTabs
          ariaLabel="attendance tabs"
          tabs={active.children.map((path) => ({ path }))}
        />
      )}
      {children}
    </>
  );
};

export default AttendanceTabsLayout;
