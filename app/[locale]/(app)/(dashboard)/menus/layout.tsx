"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Category, Tune, type SvgIconComponent } from "@mui/icons-material";
import { MenuItem, Stack, Tab, Tabs, TextField } from "@mui/material";

const MenusLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tMenus = useTranslations("menus");

  const organization = searchParams.get("organization");
  const query = new URLSearchParams({
    ...(organization ? { organization } : {}),
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

  const handleOrganizationChange = (slug: string) => {
    const params = new URLSearchParams({
      organization: slug,
      page: "1",
      pageSize: "10",
    }).toString();

    router.push(`/menus?${params}`);
  };

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Category,
      label: tMenus("sections.label"),
      value: "/menus",
    },
    {
      Icon: Tune,
      label: tMenus("modifierGroups.label"),
      value: "/menus/modifier-groups",
    },
  ];

  const currentTab = pathname.startsWith("/menus/modifier-groups")
    ? "/menus/modifier-groups"
    : "/menus";

  if (pathname.startsWith("/menus/section/")) return children;

  return (
    <Stack height="100%" gap={2}>
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

export default MenusLayout;
