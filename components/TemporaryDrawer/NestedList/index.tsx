// https://mui.com/material-ui/react-list/#NestedList.tsx
// https://mui.com/material-ui/react-breadcrumbs/#RouterBreadcrumbs.tsx

"use client";

import { useParams } from "next/navigation";

import DividerSlot from "./DividerSlot";
import SelectedListItem from "./SelectedListItem";

import { ORDER_MODE } from "@/constants/orderMode";

import { useDefaultOrganization } from "@/hooks/organizations";
import { useAuthNavItems } from "@/hooks/useAuth";
import { useCompanyNavItems } from "@/hooks/useCompany";
import { getRouteSlots, useNavigation, useRoutes } from "@/hooks/useRoutes";

import { List, ListSubheader, Toolbar } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";
import type { RouteParams } from "@/types/routeParams";

import { useAccountNavItems } from "@/utils/account";

const useNavItems = (): NavItem[] => {
  const session = useAuthStore((state) => state.session);

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const accountChildren = useAccountNavItems(DividerSlot);
  const authChildren = useAuthNavItems();
  const companyChildren = useCompanyNavItems();

  const defaultOrganizationSlug = useDefaultOrganization();

  const navItem = useRoutes();

  const isAdmin = session?.user?.role === "admin";
  const orderModeSlots = getRouteSlots(`/order/${mode}`);

  const navItems = useNavigation([
    ...(isAdmin ? [] : ["admins", "banners", "coupons"]),
    ...(defaultOrganizationSlug ? [] : ["menus", "orders"]),
  ]);

  const childrenByPath: Record<string, NavItem[]> = {
    "/auth": session ? accountChildren : authChildren,
    "/company": companyChildren,
    "/order": [
      ...(organizationSlug ? orderModeSlots.map((slot) => ({ slot })) : []),
      navItem(`/order/${ORDER_MODE.Pickup}`),
    ],
  };

  return navItems.map((item) =>
    item.path && childrenByPath[item.path]
      ? { ...item, children: childrenByPath[item.path] }
      : item,
  );
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
      {navItems.map((item, index) => (
        <SelectedListItem item={item} key={item.path || index} />
      ))}
    </List>
  );
};

export default NestedList;
