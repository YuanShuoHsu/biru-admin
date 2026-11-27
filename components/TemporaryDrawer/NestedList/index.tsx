// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-list/#sticky-subheader
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { useTranslations } from "next-intl";
import { Fragment } from "react";

import DividerSlot from "./DividerSlot";
import SelectedListItem from "./SelectedListItem";

import {
  useActiveMemberRole,
  useCanRestoreDeletedRecords,
  useDefaultOrganizationSlug,
} from "@/hooks/organizations";
import { sumReviewCountBadges } from "@/hooks/useAttendanceReviewCounts";
import { useNavChildren } from "@/hooks/useNavChildren";
import { useRoutes } from "@/hooks/useRoutes";
import { useSession } from "@/hooks/useSession";

import { List, ListSubheader, Toolbar } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { NavGroup } from "@/types/navItem";

import { hasRolePermission } from "@/utils/organizations";

const StyledGroupLabel = styled(ListSubheader)({
  backgroundImage: "var(--Paper-overlay)",
});

const useNavGroups = (): NavGroup[] => {
  const session = useSession();

  const { data: defaultOrganizationSlug = "" } = useDefaultOrganizationSlug();
  const memberRole = useActiveMemberRole();
  const canRestoreDeletedRecords = useCanRestoreDeletedRecords();

  const navChildren = useNavChildren();
  const navItem = useRoutes();

  const tAppBar = useTranslations("appBar");

  const isAdmin = session?.user?.role === "admin";
  const canAccessAdmin = isAdmin || !!defaultOrganizationSlug;

  const inventoryChildren = navChildren["/inventory"];
  const attendanceChildren = navChildren["/attendance"];

  return [
    ...(canAccessAdmin ? [{ items: [navItem("/dashboard")] }] : []),
    ...(defaultOrganizationSlug
      ? [
          {
            items: [
              {
                ...navItem("/attendance"),
                badge: sumReviewCountBadges(
                  attendanceChildren.map(({ badge }) => badge),
                ),
                children: attendanceChildren,
              },
              { ...navItem("/orders"), children: navChildren["/orders"] },
              { ...navItem("/waitlist"), children: navChildren["/waitlist"] },
              { ...navItem("/menus"), children: navChildren["/menus"] },
              ...(inventoryChildren.length
                ? [{ ...navItem("/inventory"), children: inventoryChildren }]
                : []),
              {
                ...navItem("/checklists"),
                children: navChildren["/checklists"],
              },
              ...(hasRolePermission(memberRole, { cashDevice: ["read"] })
                ? [navItem("/cash-devices")]
                : []),
              ...(isAdmin ||
              hasRolePermission(memberRole, { revenue: ["read"] }) ||
              hasRolePermission(memberRole, {
                inventoryTransaction: ["read"],
              }) ||
              hasRolePermission(memberRole, { payslip: ["read"] }) ||
              hasRolePermission(memberRole, { operatingCost: ["read"] })
                ? [navItem("/reports")]
                : []),
              ...(isAdmin ? [navItem("/store-layout")] : []),
            ],
            label: tAppBar("navGroup.store"),
          },
        ]
      : []),
    ...(canAccessAdmin
      ? [
          {
            items: [
              navItem("/coupons"),
              navItem("/organizations"),
              ...(isAdmin ||
              hasRolePermission(memberRole, { auditLog: ["read"] })
                ? [navItem("/audit-logs")]
                : []),
              ...(!isAdmin && canRestoreDeletedRecords
                ? [navItem("/deleted-records")]
                : []),
            ],
            label: tAppBar("navGroup.management"),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            items: [
              navItem("/banners"),
              navItem("/store-photos"),
              navItem("/admins"),
              { ...navItem("/points"), children: navChildren["/points"] },
              navItem("/payroll-rule-sets"),
              navItem("/deleted-records"),
              { ...navItem("/quant"), children: navChildren["/quant"] },
            ],
            label: tAppBar("navGroup.platform"),
          },
        ]
      : []),
    {
      items: [
        { ...navItem("/auth"), children: navChildren["/auth"] },
        { ...navItem("/company"), children: navChildren["/company"] },
      ],
      label: tAppBar("navGroup.more"),
    },
  ];
};

const NestedList = () => {
  const navGroups = useNavGroups();

  return (
    <List
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          <Toolbar />
        </ListSubheader>
      }
    >
      {navGroups.map(({ items, label }, groupIndex) => (
        <Fragment key={label || items[0]?.path || groupIndex}>
          {groupIndex > 0 && <DividerSlot level={0} />}
          {label && <StyledGroupLabel disableSticky>{label}</StyledGroupLabel>}
          {items.map((item, index) => (
            <SelectedListItem item={item} key={item.path || index} />
          ))}
        </Fragment>
      ))}
    </List>
  );
};

export default NestedList;
