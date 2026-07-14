"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import {
  ConfirmationNumber,
  Lock,
  Person,
  ReceiptLong,
  Stars,
  type SvgIconComponent,
} from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const AuthSettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const tAuth = useTranslations("auth");

  const navItems: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Person,
      label: tAuth("settings.account.label"),
      value: "/auth/settings/account",
    },
    {
      Icon: Lock,
      label: tAuth("settings.security.label"),
      value: "/auth/settings/security",
    },
    {
      Icon: ReceiptLong,
      label: tAuth("settings.orders.label"),
      value: "/auth/settings/orders?page=1",
    },
    {
      Icon: ConfirmationNumber,
      label: tAuth("settings.coupons.label"),
      value: "/auth/settings/coupons",
    },
    {
      Icon: Stars,
      label: tAuth("settings.points.label"),
      value: "/auth/settings/points",
    },
  ];

  const value =
    navItems.find(({ value }) => pathname.startsWith(value.split("?")[0]))
      ?.value || navItems[0].value;

  return (
    <Stack gap={2} marginBottom="auto">
      <Tabs
        aria-label="account settings tabs"
        scrollButtons="auto"
        value={value}
        variant="scrollable"
      >
        {navItems.map(({ Icon, label, value }) => (
          <Tab
            component={Link}
            href={value}
            icon={<Icon fontSize="small" />}
            iconPosition="start"
            key={value}
            label={label}
            value={value}
          />
        ))}
      </Tabs>
      {children}
    </Stack>
  );
};

export default AuthSettingsLayout;
