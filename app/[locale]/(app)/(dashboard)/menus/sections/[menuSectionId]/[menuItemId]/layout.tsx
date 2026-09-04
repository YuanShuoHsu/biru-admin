"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { Link, usePathname } from "@/i18n/navigation";

import {
  Extension,
  Kitchen,
  Tune,
  type SvgIconComponent,
} from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const MenuItemLayout = ({ children }: { children: React.ReactNode }) => {
  const { menuSectionId, menuItemId } = useParams<{
    menuSectionId: string;
    menuItemId: string;
  }>();

  const pathname = usePathname();

  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const basePath = `/menus/sections/${menuSectionId}/${menuItemId}`;
  const tabQuery = `?${new URLSearchParams({
    ...(organization && { organization }),
    ...DEFAULT_PAGINATION_QUERY,
  }).toString()}`;

  const tInventory = useTranslations("inventory");
  const tMenus = useTranslations("menus");

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Tune,
      label: tMenus("items.modifierGroups.label"),
      value: `${basePath}/modifier-groups`,
    },
    {
      Icon: Extension,
      label: tMenus("items.addOns.label"),
      value: `${basePath}/add-ons`,
    },
    {
      Icon: Kitchen,
      label: tInventory("recipes.ingredients.label"),
      value: `${basePath}/ingredients`,
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
            href={`${value}${tabQuery}`}
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
