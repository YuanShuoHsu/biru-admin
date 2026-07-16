"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { Stars, Storefront, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const AuthPointsLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const tAuth = useTranslations("auth");

  const navItems: {
    href: string;
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      href: "/auth/points/transactions?page=1&pageSize=10",
      Icon: Stars,
      label: tAuth("points.transactions.label"),
      value: "/auth/points/transactions",
    },
    {
      href: "/auth/points/store",
      Icon: Storefront,
      label: tAuth("store.label"),
      value: "/auth/points/store",
    },
  ];

  const value = pathname.startsWith("/auth/points/store")
    ? "/auth/points/store"
    : "/auth/points/transactions";

  return (
    <Stack gap={2} marginBottom="auto">
      <Tabs
        aria-label="points tabs"
        scrollButtons="auto"
        value={value}
        variant="scrollable"
      >
        {navItems.map(({ href, Icon, label, value }) => (
          <Tab
            component={Link}
            href={href}
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
