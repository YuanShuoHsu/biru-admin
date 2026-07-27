"use client";

import { useTranslations } from "next-intl";

import { useLogout } from "@/hooks/useLogout";
import { useRoutes } from "@/hooks/useRoutes";

import { Logout } from "@mui/icons-material";

import type { NavItem } from "@/types/navItem";

export const useAuthNavItems = (): NavItem[] => {
  const navItem = useRoutes();

  return [navItem("/auth/sign-in"), navItem("/auth/sign-up")];
};

export const useLogoutNavItem = (): NavItem => {
  const tAuth = useTranslations("auth");
  const { handleLogoutDialog } = useLogout();

  return {
    icon: Logout,
    label: tAuth("signOut.label"),
    onClick: handleLogoutDialog,
  };
};
