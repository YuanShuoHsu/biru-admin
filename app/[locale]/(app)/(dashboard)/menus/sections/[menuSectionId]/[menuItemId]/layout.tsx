"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";

import { Extension, Tune, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const MenuItemLayout = ({ children }: { children: React.ReactNode }) => {
  const { menuSectionId, menuItemId } = useParams<{
    menuSectionId: string;
    menuItemId: string;
  }>();

  const pathname = usePathname();
  const tMenus = useTranslations("menus");

  const basePath = `/menus/sections/${menuSectionId}/${menuItemId}`;

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Extension,
      label: tMenus("addOns.label"),
      value: `${basePath}/add-ons`,
    },
    {
      Icon: Tune,
      label: tMenus("modifierGroups.label"),
      value: `${basePath}/modifier-groups`,
    },
  ];

  const currentTab =
    tabs.find(({ value }) => pathname.startsWith(value))?.value ||
    tabs[0].value;

  return (
    <Stack height="100%" gap={2}>
      <Tabs
        aria-label="menu item tabs"
        scrollButtons="auto"
        value={currentTab}
        variant="scrollable"
      >
        {tabs.map(({ Icon, label, value }) => (
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

export default MenuItemLayout;
