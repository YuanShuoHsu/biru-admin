"use client";

import { useTranslations } from "next-intl";

import { useLogoutNavItem } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";

import { useRouter } from "@/i18n/navigation";

import { PersonAdd } from "@mui/icons-material";
import { Divider } from "@mui/material";

import type { NavItem, Slot } from "@/types/navItem";

const DividerSlot: Slot = () => <Divider flexItem />;

export const useAccountNavItems = (): NavItem[] => {
  const addAccountItem = useAddAccountNavItem();
  const logoutItem = useLogoutNavItem();
  const settingsItem = useSettingsNavItem();

  return [settingsItem, logoutItem, { slot: DividerSlot }, addAccountItem];
};

export const useAddAccountNavItem = (): NavItem => {
  const tAuth = useTranslations("auth");
  const router = useRouter();

  const navItem = useRoutes();
  const { to } = navItem("/auth/sign-in");

  return {
    icon: PersonAdd,
    label: tAuth("addAccount.label"),
    onClick: () => to && router.push(to),
  };
};

export const useCouponsNavItem = (): NavItem => {
  const navItem = useRoutes();

  return navItem("/auth/coupons");
};

export const useOrdersNavItem = (): NavItem => {
  const navItem = useRoutes();

  return navItem("/auth/orders");
};

export const usePointsNavItem = (): NavItem => {
  const navItem = useRoutes();

  return navItem("/auth/points");
};

export const useSettingsNavItem = (): NavItem => {
  const navItem = useRoutes();

  return navItem("/auth/settings");
};
