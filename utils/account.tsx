"use client";

import { useTranslations } from "next-intl";

import { useLogoutNavItem, useStorefrontNavItem } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";

import DividerSlot from "@/components/TemporaryDrawer/NestedList/DividerSlot";

import { PersonAdd } from "@mui/icons-material";

import type { NavItem } from "@/types/navItem";

export const useAccountNavItems = (): NavItem[] => {
  const storefrontNavItem = useStorefrontNavItem();

  const addAccountItem = useAddAccountNavItem();
  const logoutItem = useLogoutNavItem();

  return [
    storefrontNavItem("/auth/orders"),
    storefrontNavItem("/auth/coupons"),
    storefrontNavItem("/auth/points"),
    { slot: DividerSlot },
    storefrontNavItem("/auth/settings"),
    logoutItem,
    { slot: DividerSlot },
    addAccountItem,
  ];
};

export const useAddAccountNavItem = (): NavItem => {
  const tAuth = useTranslations("auth");

  const navItem = useRoutes();

  return {
    ...navItem("/auth/sign-in"),
    icon: PersonAdd,
    label: tAuth("addAccount.label"),
  };
};
