"use client";

import RouteTabs from "@/components/RouteTabs";

import { useSelectedMemberRole } from "@/hooks/organizations";

import { hasRolePermission } from "@/utils/organizations";

const ChecklistsTabs = () => {
  const memberRole = useSelectedMemberRole();

  return (
    <RouteTabs
      ariaLabel="checklists tabs"
      tabs={[
        { path: "/checklists/today" },
        ...(hasRolePermission(memberRole, { organization: ["update"] })
          ? [{ path: "/checklists/templates" }]
          : []),
      ]}
    />
  );
};

export default ChecklistsTabs;
