"use client";

import { useTranslations } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";

import { useAuthMenuItems, useLogoutMenuItem } from "@/hooks/useAuth";

import { Grid, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { MenuItem } from "@/types/menuItem";

import {
  useAccountSettingsMenuItem,
  useAddAnotherAccountMenuItem,
} from "@/utils/account";

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
}));

const useFooterItems = (): MenuItem[] => {
  const { session } = useAuthStore((state) => state);

  const tAuth = useTranslations("auth");
  const tAccount = useTranslations("account");
  const tCompany = useTranslations("company");
  const tOrder = useTranslations("order");

  const authChildren = useAuthMenuItems();

  const accountSettingsItem = useAccountSettingsMenuItem();
  const addAnotherAccountItem = useAddAnotherAccountMenuItem();

  const accountChildren = [
    accountSettingsItem,
    useLogoutMenuItem(),
    addAnotherAccountItem,
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
      ...(session
        ? {
            children: accountChildren,
            label: tAccount("label"),
            to: "/account",
          }
        : {
            children: authChildren,
            label: tAuth("label"),
            to: "/auth",
          }),
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
      {footerItems.map(
        ({ children, label: parentLabel, slot: Slot, to: parentTo }, index) => (
          <StyledGrid key={parentLabel || index} size={{ xs: 6, md: 2 }}>
            {Slot ? (
              <Slot level={0} />
            ) : (
              <>
                <Typography color="text.primary" variant="subtitle2">
                  {parentLabel}
                </Typography>
                {children?.map(
                  ({ label: childLabel, onClick, to: childTo }) => (
                    <Link
                      color="text.secondary"
                      {...(onClick
                        ? { component: "button" }
                        : { href: `${parentTo}${childTo}` })}
                      key={onClick ? childLabel : childTo}
                      onClick={onClick}
                      underline="hover"
                      variant="body2"
                    >
                      {childLabel}
                    </Link>
                  ),
                )}
              </>
            )}
          </StyledGrid>
        ),
      )}
    </>
  );
};

export default LinkSection;
