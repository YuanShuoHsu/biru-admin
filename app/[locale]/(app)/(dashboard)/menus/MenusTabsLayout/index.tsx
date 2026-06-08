"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

import UpdateMenuDialog from "../UpdateMenuDialog";

import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Category,
  Edit,
  Tune,
  type SvgIconComponent,
} from "@mui/icons-material";
import {
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const MenusTabsLayout = ({ children }: { children: React.ReactNode }) => {
  const { setDialog } = useDialogStore((state) => state);

  const pathname = usePathname();
  const router = useRouter();
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

  const handleOrganizationChange = (slug: string) => {
    const params = new URLSearchParams({
      organization: slug,
      page: "1",
      pageSize: "10",
    }).toString();

    router.push(`${currentTab}?${params}`);
  };

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
      <Stack direction="row" alignItems="center" gap={1}>
        <TextField
          label={tMenus("organization.label")}
          select
          size="small"
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: () =>
                selectedOrganization ? (
                  selectedOrganization.name
                ) : (
                  <em>{tMenus("organization.placeholder")}</em>
                ),
            },
          }}
          sx={{ width: 200 }}
          value={selectedOrganization?.slug || ""}
          onChange={(event) => handleOrganizationChange(event.target.value)}
        >
          <MenuItem disabled value="">
            <em>{tMenus("organization.placeholder")}</em>
          </MenuItem>
          {organizations.map(({ id, name, slug }) => (
            <MenuItem key={id} value={slug}>
              {name}
            </MenuItem>
          ))}
        </TextField>
        {menu && (
          <Tooltip title={tMenus("settings.actions.update.title")}>
            <IconButton onClick={handleEditMenu} size="small">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
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
