"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

import UpdateMenuDialog from "../UpdateMenuDialog";

import { Link, usePathname } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Category,
  Edit,
  Tune,
  type SvgIconComponent,
} from "@mui/icons-material";
import {
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const MenusTabsLayout = ({ children }: { children: React.ReactNode }) => {
  const { setDialog } = useDialogStore((state) => state);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const organization = searchParams.get("organization");
  const query = new URLSearchParams({
    ...(organization && { organization }),
    page: "1",
    pageSize: "10",
  }).toString();

  const { data: organizations = [] } = useSWR("organization-list", async () => {
    const { data } = await authClient.organization.list();

    return data || [];
  });
  const selectedOrganization = organizations.find(
    ({ slug }) => slug === organization,
  );

  const { data: menu, mutate: mutateMenu } = useSWR<Menu>(
    selectedOrganization
      ? `organization-menu-${selectedOrganization.id}`
      : null,
    () =>
      fetcher<Menu[]>(
        `/api/organizations/${selectedOrganization!.id}/menus`,
      ).then((menus) => menus[0]),
  );

  const tMenus = useTranslations("menus");

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Category,
      label: tMenus("sections.label"),
      value: "/menus/sections",
    },
    {
      Icon: Tune,
      label: tMenus("modifierGroups.label"),
      value: "/menus/modifier-groups",
    },
  ];

  const currentTab =
    tabs.find(({ value }) => pathname.startsWith(value))?.value ??
    tabs[0].value;

  const handleEditMenu = () => {
    if (!menu) return;

    setDialog({
      content: <UpdateMenuDialog menu={menu} mutate={mutateMenu} />,
      formId: "update-menu-form",
      open: true,
      title: tMenus("settings.actions.update.title"),
    });
  };

  return (
    <Stack height="100%" gap={2}>
      {menu && (
        <Tooltip title={tMenus("settings.actions.update.title")}>
          <IconButton onClick={handleEditMenu} size="small">
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
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

export default MenusTabsLayout;
