"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { PersonAdd, Settings } from "@mui/icons-material";

import type { MenuItem } from "@/types/menuItem";

export const useAddAnotherAccountMenuItem = (): MenuItem => {
  const tAccount = useTranslations("account");
  const router = useRouter();

  return {
    icon: PersonAdd,
    label: tAccount("accountMenu.addAnotherAccount"),
    onClick: () => router.push("/auth/sign-in"),
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
