"use client";

import { useNavItem } from "@/hooks/useNavItem";

import { Link, usePathname } from "@/i18n/navigation";

import { Tab, Tabs } from "@mui/material";

interface RouteTab {
  label?: React.ReactNode;
  path: string;
}

interface RouteTabsProps {
  ariaLabel: string;
  tabs: RouteTab[];
}

const RouteTabs = ({ ariaLabel, tabs }: RouteTabsProps) => {
  const pathname = usePathname();

  const navItem = useNavItem();

  const value =
    tabs.find(({ path }) => pathname.startsWith(path))?.path || tabs[0].path;

  return (
    <Tabs
      aria-label={ariaLabel}
      scrollButtons="auto"
      value={value}
      variant="scrollable"
    >
      {tabs.map(({ label, path }) => {
        const { icon: Icon, label: routeLabel, to } = navItem(path);

        return (
          <Tab
            component={Link}
            href={to}
            icon={Icon && <Icon fontSize="small" />}
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
