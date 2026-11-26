"use client";

import { useLocale, useTranslations } from "next-intl";

import { useLogout } from "@/hooks/useLogout";
import { useRoutes } from "@/hooks/useRoutes";

import { Logout } from "@mui/icons-material";

import type { NavItem } from "@/types/navItem";

export const useStorefrontHref = () => {
  const locale = useLocale();

  return (href: string) =>
    `${process.env.NEXT_PUBLIC_NEXT_URL}/${locale}${href}`;
};

export const useStorefrontNavItem = () => {
  const navItem = useRoutes();
  const storefrontHref = useStorefrontHref();

  return (path: string): NavItem => {
    const item = navItem(path);

    return { ...item, to: item.to && storefrontHref(item.to) };
  };
};

export const useAuthNavItems = (): NavItem[] => {
  const navItem = useRoutes();
  const storefrontHref = useStorefrontHref();

  return [
    navItem("/auth/sign-in"),
    { ...navItem("/auth/sign-up"), to: storefrontHref("/auth/sign-up") },
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
