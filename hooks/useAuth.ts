"use client";

import { useTranslations } from "next-intl";

import { query } from "@/constants/query";

import { useLogout } from "@/hooks/useLogout";
import { useRoutes } from "@/hooks/useRoutes";

import { Logout } from "@mui/icons-material";

import type { NavItem } from "@/types/navItem";

import { getHref } from "@/utils/href";

export const useAuthNavItems = (redirectTo?: string): NavItem[] => {
  const navItem = useRoutes();

  return [
    navItem(
      "/auth/sign-in",
      getHref("/auth/sign-in", { [query.redirectTo]: redirectTo }),
    ),
    navItem(
      "/auth/sign-up",
      getHref("/auth/sign-up", { [query.redirectTo]: redirectTo }),
    ),
  ];
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
