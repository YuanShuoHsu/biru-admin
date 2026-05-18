"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";

import { Extension, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const MenuItemLayout = ({ children }: { children: React.ReactNode }) => {
  const { menuId, menuSectionId, menuItemId } = useParams<{
    menuId: string;
    menuSectionId: string;
    menuItemId: string;
  }>();

  const pathname = usePathname();
  const tMenus = useTranslations("menus");

  const basePath = `/menus/${menuId}/${menuSectionId}/${menuItemId}`;

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
