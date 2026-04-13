"use client";

import { useTranslations } from "next-intl";

import { PersonAdd, Settings } from "@mui/icons-material";

import type { MenuItem } from "@/types/menuItem";

export const useAddAnotherAccountMenuItem = (): MenuItem => {
  const tAccount = useTranslations("account");

  return {
    icon: PersonAdd,
    label: tAccount("accountMenu.addAnotherAccount"),
    to: "/add-another-account",
  };
};

export const useAccountSettingsMenuItem = (): MenuItem => {
  const tAccount = useTranslations("account");

  return {
    icon: Settings,
    label: tAccount("accountSettings.label"),
    to: "/account-settings",
  };
};
