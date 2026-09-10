"use client";

import { useTranslations } from "next-intl";

import { useLogoutNavItem } from "@/hooks/useAuth";
import { useRoutes } from "@/hooks/useRoutes";

import { PersonAdd } from "@mui/icons-material";
import { Divider } from "@mui/material";

import type { NavItem, Slot } from "@/types/navItem";

const DividerSlot: Slot = () => <Divider flexItem />;

export const useAccountNavItems = (): NavItem[] => {
  const navItem = useRoutes();

  const addAccountItem = useAddAccountNavItem();
  const logoutItem = useLogoutNavItem();

  return [
    navItem("/auth/settings"),
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
