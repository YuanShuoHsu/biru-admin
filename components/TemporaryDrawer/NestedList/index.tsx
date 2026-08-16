// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { Fragment } from "react";

import { useParams } from "next/navigation";

import DividerSlot from "./DividerSlot";
import OrderModeMenuItem from "./OrderModeMenuItem";
import SelectedListItem from "./SelectedListItem";

import { ORDER_MODE } from "@/constants/orderMode";

import {
  useActiveMemberRole,
  useDefaultOrganization,
} from "@/hooks/organizations";
import { useNavChildren } from "@/hooks/useNavChildren";
import { useRoutes } from "@/hooks/useRoutes";

import { List, ListSubheader, Toolbar } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";
import type { RouteParams } from "@/types/routeParams";

import { hasRolePermission } from "@/utils/organizations";

const useNavItems = (): NavItem[][] => {
  const session = useAuthStore((state) => state.session);

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const defaultOrganizationSlug = useDefaultOrganization();
  const memberRole = useActiveMemberRole();

  const navChildren = useNavChildren();
  const navItem = useRoutes();

  const isAdmin = session?.user?.role === "admin";
  const isInStoreOrder =
    Boolean(organizationSlug) &&
    [ORDER_MODE.Counter, ORDER_MODE.DineIn, ORDER_MODE.DriveThru].some(
      (orderMode) => orderMode === mode,
    );

  return [
    [
      navItem("/dashboard"),
      {
        ...navItem("/order"),
        children: [
          ...(isInStoreOrder ? [{ slot: OrderModeMenuItem }] : []),
          navItem(`/order/${ORDER_MODE.Pickup}`),
        ],
      },
      ...(defaultOrganizationSlug
        ? [navItem("/orders"), navItem("/menus")]
        : []),
    ],
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
