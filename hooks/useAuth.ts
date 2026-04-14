"use client";

import { useTranslations } from "next-intl";

import { query } from "@/constants/query";

import { useLogout } from "@/hooks/useLogout";

import { Login, Logout, PersonAdd } from "@mui/icons-material";

import type { MenuItem } from "@/types/menuItem";

import { getHref } from "@/utils/href";

export const useAuthMenuItems = (redirectTo?: string): MenuItem[] => {
  const tAuth = useTranslations("auth");

  const signInTo = getHref("/sign-in", {
    [query.redirectTo]: redirectTo,
  });

  const signUpTo = getHref("/sign-up", {
    [query.redirectTo]: redirectTo,
  });

  return [
    {
      icon: Login,
      label: tAuth("signIn.label"),
      to: signInTo,
    },
    {
      icon: PersonAdd,
      label: tAuth("signUp.label"),
      to: signUpTo,
    },
  ];
};

export const useLogoutMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");
  const { handleLogout } = useLogout();

  return {
    icon: Logout,
    label: tAuth("signOut.label"),
    onClick: handleLogout,
  };
};
