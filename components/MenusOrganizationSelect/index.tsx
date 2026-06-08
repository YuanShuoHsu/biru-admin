"use client";

import { useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";

import type { OrganizationResponse } from "@/types/organizations";

import { MenuItem, TextField, styled } from "@mui/material";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

interface MenusOrganizationSelectProps {
  organizations: OrganizationResponse[];
  organizationSlug: string;
}

const MenusOrganizationSelect = ({
  organizations,
  organizationSlug,
}: MenusOrganizationSelectProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const tMenus = useTranslations("menus");

  const currentOrganization = organizations.find(
    ({ slug }) => slug === organizationSlug,
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams({
      organization: event.target.value,
      page: "1",
      pageSize: "10",
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <StyledTextField
      fullWidth
      label={tMenus("organization.label")}
      select
      size="small"
      slotProps={{
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          renderValue: () =>
            currentOrganization ? (
              currentOrganization.name
            ) : (
              <em>{tMenus("organization.placeholder")}</em>
            ),
        },
      }}
      value={currentOrganization?.slug || ""}
      onChange={handleChange}
    >
      <MenuItem disabled value="">
        <em>{tMenus("organization.placeholder")}</em>
      </MenuItem>
      {organizations.map(({ id, name, slug }) => (
        <MenuItem key={id} value={slug}>
          {name}
        </MenuItem>
      ))}
    </StyledTextField>
  );
};

export default MenusOrganizationSelect;
