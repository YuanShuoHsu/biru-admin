"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import {
  ConfirmationNumber,
  PersonAdd,
  ReceiptLong,
  Settings,
  Stars,
} from "@mui/icons-material";

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

export const useCouponsMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");

  return {
    icon: ConfirmationNumber,
    label: tAuth("coupons.label"),
    to: "/coupons",
  };
};

export const useOrdersMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");

  return {
    icon: ReceiptLong,
    label: tAuth("orders.label"),
    to: "/orders",
  };
};

export const usePointsMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");

  return {
    icon: Stars,
    label: tAuth("points.label"),
    to: "/points",
  };
};

export const useSettingsMenuItem = (): MenuItem => {
  const tAuth = useTranslations("auth");

  return {
    icon: Settings,
    label: tAuth("settings.label"),
    to: "/settings/account",
  };
};
