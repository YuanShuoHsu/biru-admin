"use client";

import NavItemChip from "@/components/NavItemChip";

import { useRoutes } from "@/hooks/useRoutes";

import { usePathname } from "@/i18n/navigation";

import { Stack, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { NavBadge } from "@/types/navItem";

const TabLabelStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface RouteTab {
  badge?: NavBadge;
  label?: React.ReactNode;
  path: string;
}

interface RouteTabsProps {
  ariaLabel: string;
  tabs: RouteTab[];
}

const RouteTabs = ({ ariaLabel, tabs }: RouteTabsProps) => {
  const pathname = usePathname();

  const navItem = useRoutes();

  const value =
    tabs.find(({ path }) => pathname.startsWith(path))?.path ||
    tabs[0]?.path ||
    false;

  return (
    <Tabs
      aria-label={ariaLabel}
      scrollButtons="auto"
      value={value}
      variant="scrollable"
    >
      {tabs.map(({ badge, label, path }) => {
        const { icon: Icon, label: routeLabel, to } = navItem(path);

        return (
          <Tab
            {...(to ? { href: to } : {})}
            icon={Icon && <Icon fontSize="small" />}
            iconPosition="start"
            key={path}
            label={
              badge ? (
                <TabLabelStack direction="row">
                  {label || routeLabel}
                  <NavItemChip badge={badge} />
                </TabLabelStack>
              ) : (
                label || routeLabel
              )
            }
            value={path}
          />
        );
      })}
    </Tabs>
  );
};

export default RouteTabs;
