"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";

import { Category, Tune, type SvgIconComponent } from "@mui/icons-material";
import { Stack, Tab, Tabs } from "@mui/material";

const MenuLayout = ({ children }: { children: React.ReactNode }) => {
  const { menuId } = useParams<{ menuId: string }>();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tMenus = useTranslations("menus");

  const organization = searchParams.get("organization");
  const query = new URLSearchParams({
    ...(organization ? { organization } : {}),
    page: "1",
    pageSize: "10",
  }).toString();

  const basePath = `/menus/${menuId}`;

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Category,
      label: tMenus("sections.label"),
      value: `${basePath}/sections`,
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
        aria-label="menu tabs"
        scrollButtons="auto"
        value={currentTab}
        variant="scrollable"
      >
        {tabs.map(({ Icon, label, value }) => (
          <Tab
            component={Link}
            href={`${value}?${query}`}
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

export default MenuLayout;
