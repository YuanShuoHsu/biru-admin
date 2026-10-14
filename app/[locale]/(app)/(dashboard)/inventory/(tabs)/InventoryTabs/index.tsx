"use client";

import RouteTabs from "@/components/RouteTabs";

import { useSelectedMemberRole } from "@/hooks/organizations";

import { hasRolePermission } from "@/utils/organizations";

const InventoryTabs = () => {
  const memberRole = useSelectedMemberRole();

  const tabs = [
    ...(hasRolePermission(memberRole, { inventory: ["read"] })
      ? [{ path: "/inventory/ingredients" }]
      : []),
    ...(hasRolePermission(memberRole, { purchasing: ["read"] })
      ? [{ path: "/inventory/suppliers" }]
      : []),
  ];

  return (
    (memberRole === undefined || tabs.length > 0) && (
      <RouteTabs ariaLabel="inventory tabs" tabs={tabs} />
    )
  );
};

export default InventoryTabs;
