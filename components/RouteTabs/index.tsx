"use client";

import { useRoutes } from "@/hooks/useRoutes";

import { Link, usePathname } from "@/i18n/navigation";

import { Badge, Tab, Tabs } from "@mui/material";

interface RouteTab {
  badge?: number;
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
    tabs.find(({ path }) => pathname.startsWith(path))?.path || tabs[0].path;

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
            {...(to ? { component: Link, href: to } : {})}
            icon={
              Icon && (
                <Badge badgeContent={badge} color="error">
                  <Icon fontSize="small" />
                </Badge>
              )
            }
            iconPosition="start"
            key={path}
            label={label || routeLabel}
            value={path}
          />
        );
      })}
    </Tabs>
  );
};

export default RouteTabs;
