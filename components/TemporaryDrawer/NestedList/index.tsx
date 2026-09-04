// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { Fragment } from "react";

import DividerSlot from "./DividerSlot";
import SelectedListItem from "./SelectedListItem";

import {
  useActiveMemberRole,
  useDefaultOrganization,
} from "@/hooks/organizations";
import { useNavChildren } from "@/hooks/useNavChildren";
import { useRoutes } from "@/hooks/useRoutes";

import { List, ListSubheader, Toolbar } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";

import { hasRolePermission } from "@/utils/organizations";

const useNavItems = (): NavItem[][] => {
  const session = useAuthStore((state) => state.session);

  const defaultOrganizationSlug = useDefaultOrganization();
  const memberRole = useActiveMemberRole();

  const navChildren = useNavChildren();
  const navItem = useRoutes();

  const isAdmin = session?.user?.role === "admin";

  return [
    [
      navItem("/dashboard"),
      ...(defaultOrganizationSlug ? [navItem("/orders")] : []),
    ],
    ...(defaultOrganizationSlug
      ? [
          [
            navItem("/menus"),
            ...(hasRolePermission(memberRole, { inventory: ["read"] })
              ? [
                  navItem("/ingredients"),
                  navItem("/suppliers"),
                  navItem("/recipes"),
                ]
              : []),
          ],
        ]
      : []),
    [
      ...(isAdmin || defaultOrganizationSlug ? [navItem("/coupons")] : []),
      navItem("/organizations"),
      ...(isAdmin || hasRolePermission(memberRole, { auditLog: ["read"] })
        ? [navItem("/audit-logs")]
        : []),
    ],
    ...(isAdmin ? [[navItem("/banners"), navItem("/admins")]] : []),
    [
      { ...navItem("/auth"), children: navChildren["/auth"] },
      { ...navItem("/company"), children: navChildren["/company"] },
    ],
  ];
};

const NestedList = () => {
  const navItems = useNavItems();

  return (
    <List
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          <Toolbar />
        </ListSubheader>
      }
    >
      {navItems.map((group, groupIndex) => (
        <Fragment key={group[0]?.path || groupIndex}>
          {groupIndex > 0 && <DividerSlot level={0} />}
          {group.map((item, index) => (
            <SelectedListItem item={item} key={item.path || index} />
          ))}
        </Fragment>
      ))}
    </List>
  );
};

export default NestedList;
