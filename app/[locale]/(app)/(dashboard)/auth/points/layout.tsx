"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { Stars, Storefront, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const AuthPointsLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const tAuth = useTranslations("auth");

  const navItems: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Stars,
      label: tAuth("points.transactions"),
      value: "/auth/points",
    },
    {
      Icon: Storefront,
      label: tAuth("store.label"),
      value: "/auth/points/store",
    },
  ];

  const value = pathname.startsWith("/auth/points/store")
    ? "/auth/points/store"
    : "/auth/points";

  return (
    <Stack gap={2} marginBottom="auto">
      <Tabs
        aria-label="points tabs"
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

export default AuthPointsLayout;
