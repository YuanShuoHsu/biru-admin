"use client";

import { useTranslations } from "next-intl";

import { PersonAdd, Settings } from "@mui/icons-material";
import { Avatar } from "@mui/material";

import type { MenuItem } from "@/types/menuItem";

export const useProfileMenuItems = (): MenuItem[] => {
  const tAccount = useTranslations("account");

  return [
    {
      icon: Avatar,
      label: tAccount("accountMenu.profile"),
      to: "/profile",
    },
    {
      icon: Avatar,
      label: tAccount("accountMenu.myAccount"),
      to: "/my-account",
    },
  ];
};

export const useAccountMenuItems = (): MenuItem[] => {
  const tAccount = useTranslations("account");

  return [
    {
      icon: PersonAdd,
      label: tAccount("accountMenu.addAnotherAccount"),
      to: "/add-another-account",
    },
    {
      icon: Settings,
      label: tAccount("accountSettings.label"),
      to: "/account-settings",
    },
  ];
};
