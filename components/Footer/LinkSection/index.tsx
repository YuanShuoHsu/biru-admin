"use client";

import { useTranslations } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";

import { useAuthMenuItems, useLogoutMenuItem } from "@/hooks/useAuth";

import { Divider, Grid, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { MenuItem } from "@/types/menuItem";

import { useAddAccountMenuItem, useSettingsMenuItem } from "@/utils/account";

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
}));

const useFooterItems = (): MenuItem[] => {
  const { session } = useAuthStore((state) => state);

  const tAuth = useTranslations("auth");
  const tCompany = useTranslations("company");
  const tOrder = useTranslations("order");

  const addAccountItem = useAddAccountMenuItem();
  const authChildren = useAuthMenuItems();
  const logoutMenuItem = useLogoutMenuItem();
  const settingsItem = useSettingsMenuItem();

  const accountChildren: MenuItem[] = [
    settingsItem,
    logoutMenuItem,
    { slot: () => <Divider flexItem /> },
    addAccountItem,
  ];

  return [
    {
      children: [
        {
          label: tOrder("mode.pickup.label"),
          to: `/${ORDER_MODE.Pickup}`,
        },
      ],
      label: tOrder("label"),
      to: "/order",
    },
    {
      children: session ? accountChildren : authChildren,
      label: tAuth("label"),
      to: "/auth",
    },
    {
      children: [
        {
          label: tCompany("about.label"),
          to: `/about`,
        },
        {
          label: tCompany("legal.terms.label"),
          to: `/terms`,
        },
        {
          label: tCompany("legal.privacy.label"),
          to: `/privacy`,
        },
      ],
      label: tCompany("label"),
      to: "/company",
    },
  ];
};

const LinkSection = () => {
  const footerItems = useFooterItems();

  return (
    <>
      {footerItems.map(({ children, label: parentLabel, to: parentTo }) => (
        <StyledGrid key={parentTo} size={{ xs: 6, md: 2 }}>
          <Typography color="text.primary" variant="subtitle2">
            {parentLabel}
          </Typography>
          {children?.map(
            (
              { label: childLabel, onClick, slot: Slot, to: childTo },
              itemIndex,
            ) => {
              if (Slot) return <Slot key={itemIndex} />;

              return (
                <Link
                  color="text.secondary"
                  component={onClick ? "button" : "a"}
                  href={onClick ? undefined : `${parentTo}${childTo}`}
                  key={itemIndex}
                  onClick={onClick}
                  underline="hover"
                  variant="body2"
                >
                  {childLabel}
                </Link>
              );
            },
          )}
        </StyledGrid>
      ))}
    </>
  );
};

export default LinkSection;
