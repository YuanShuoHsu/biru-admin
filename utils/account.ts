"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { PersonAdd, Settings } from "@mui/icons-material";

import type { MenuItem } from "@/types/menuItem";

export const useAddAccountMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");
  const router = useRouter();

  return {
    icon: PersonAdd,
    label: tAuth("addAccount.label"),
    onClick: () => router.push("/auth/sign-in"),
  };
};

export const useSettingsMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");

  return {
    icon: Settings,
    label: tAuth("settings.label"),
    to: "/settings",
  };
};
