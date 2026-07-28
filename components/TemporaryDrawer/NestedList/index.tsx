// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { Fragment } from "react";

import { useParams } from "next/navigation";

import DividerSlot from "./DividerSlot";
import OrderModeMenuItem from "./OrderModeMenuItem";
import SelectedListItem from "./SelectedListItem";

import { ORDER_MODE } from "@/constants/orderMode";

import { useDefaultOrganization } from "@/hooks/organizations";
import { useAuthNavItems } from "@/hooks/useAuth";
import { useCompanyNavItems } from "@/hooks/useCompany";
import { useNavigation, useRoutes } from "@/hooks/useRoutes";

import { List, ListSubheader, Toolbar } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";
import type { RouteParams } from "@/types/routeParams";

import { useAccountNavItems } from "@/utils/account";

const useNavGroups = (): NavItem[][] => {
  const session = useAuthStore((state) => state.session);

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const accountChildren = useAccountNavItems();
  const authChildren = useAuthNavItems();
  const companyChildren = useCompanyNavItems();

  const defaultOrganizationSlug = useDefaultOrganization();

  const navItem = useRoutes();

  const isAdmin = session?.user?.role === "admin";
  const isInStoreOrder =
    Boolean(organizationSlug) &&
    [ORDER_MODE.Counter, ORDER_MODE.DineIn, ORDER_MODE.Kiosk].some(
      (orderMode) => orderMode === mode,
    );

  const navGroups = useNavigation([
    ...(isAdmin ? [] : ["admins", "banners", "coupons"]),
    ...(defaultOrganizationSlug ? [] : ["menus", "orders"]),
  ]);

  const childrenByPath: Record<string, NavItem[]> = {
    "/auth": session ? accountChildren : authChildren,
    "/company": companyChildren,
    "/order": [
      ...(isInStoreOrder ? [{ slot: OrderModeMenuItem }] : []),
      navItem(`/order/${ORDER_MODE.Pickup}`),
    ],
  };

  return navGroups.map((group) =>
    group.map((item) =>
      item.path && childrenByPath[item.path]
        ? { ...item, children: childrenByPath[item.path] }
        : item,
    ),
  );
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
      {navGroups.map((group, groupIndex) => (
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
