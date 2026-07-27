"use client";

import { useTranslations } from "next-intl";

import { useLogoutNavItem } from "@/hooks/useAuth";
import { useNavItem } from "@/hooks/useNavItem";

import { useRouter } from "@/i18n/navigation";

import { PersonAdd } from "@mui/icons-material";

import type { NavItem } from "@/types/navItem";

export const useAccountNavItems = (divider: NavItem["slot"]): NavItem[] => {
  const addAccountItem = useAddAccountNavItem();
  const logoutItem = useLogoutNavItem();
  const settingsItem = useSettingsNavItem();

  return [settingsItem, logoutItem, { slot: divider }, addAccountItem];
};

export const useAddAccountNavItem = (): NavItem => {
  const tAuth = useTranslations("auth");
  const router = useRouter();

  return {
    icon: PersonAdd,
    label: tAuth("addAccount.label"),
    onClick: () => router.push("/auth/sign-in"),
  };
};

export const useCouponsNavItem = (): NavItem => {
  const navItem = useNavItem();

  return navItem("/auth/coupons");
};

export const useOrdersNavItem = (): NavItem => {
  const navItem = useNavItem();

  return navItem("/auth/orders");
};

export const usePointsNavItem = (): NavItem => {
  const navItem = useNavItem();

  return navItem("/auth/points", "/auth/points/transactions");
};

export const useSettingsNavItem = (): NavItem => {
  const navItem = useNavItem();

  return navItem("/auth/settings", "/auth/settings/account");
};
