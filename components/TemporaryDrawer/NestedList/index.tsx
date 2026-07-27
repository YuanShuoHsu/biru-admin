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
import { useRoutes } from "@/hooks/useRoutes";

import { List, ListSubheader, Toolbar } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";
import type { RouteParams } from "@/types/routeParams";

import { useAccountNavItems } from "@/utils/account";

const useNavItems = (): NavItem[] => {
  const session = useAuthStore((state) => state.session);

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const isAdmin = session?.user?.role === "admin";

  const accountChildren = useAccountNavItems(DividerSlot);
  const authChildren = useAuthNavItems();
  const companyChildren = useCompanyNavItems();

  const defaultOrganizationSlug = useDefaultOrganization();

  const navItem = useRoutes();

  const orderModeItem = navItem(`/order/${mode}/current-store`);

  const adminItems: NavItem[] = isAdmin
    ? [
        navItem("/divider"),
        navItem("/coupons"),
        navItem("/banners"),
        navItem("/admins"),
      ]
    : [];

  const orderChildren: NavItem[] = [
    ...(organizationSlug && orderModeItem.slot ? [orderModeItem] : []),
    navItem(`/order/${ORDER_MODE.Pickup}`),
  ];

  return [
    navItem("/dashboard"),
    {
      ...navItem("/order"),
      children: orderChildren,
    },
    ...(defaultOrganizationSlug ? [navItem("/orders"), navItem("/menus")] : []),
    navItem("/organizations"),
    ...adminItems,
    navItem("/divider"),
    {
      ...navItem("/auth"),
      children: session ? accountChildren : authChildren,
    },
    {
      ...navItem("/company"),
      children: companyChildren,
    },
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
      {navItems.map((item, index) => (
        <SelectedListItem item={item} key={item.path || index} />
      ))}
    </List>
  );
};

export default NestedList;
