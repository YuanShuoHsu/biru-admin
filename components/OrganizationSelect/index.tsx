"use client";

import { useTranslations } from "next-intl";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { usePathname, useRouter } from "@/i18n/navigation";

import type { OrganizationResponse } from "@/types/organizations";

import { MenuItem, TextField, styled } from "@mui/material";

import { getHref } from "@/utils/href";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

interface OrganizationSelectProps {
  organizations: Pick<OrganizationResponse, "id" | "name" | "slug">[];
  organizationSlug: string;
  readOnly?: boolean;
}

const OrganizationSelect = ({
  organizations,
  organizationSlug,
  readOnly = false,
}: OrganizationSelectProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const tCommon = useTranslations("common");

  const currentOrganization = organizations.find(
    ({ slug }) => slug === organizationSlug,
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    router.push(
      getHref(pathname, {
        organization: event.target.value,
        ...DEFAULT_PAGINATION_QUERY,
      }),
    );
  };

  return (
    <StyledTextField
      fullWidth
      label={tCommon("organization.label")}
      select={!readOnly}
      size="small"
      slotProps={{
        input: readOnly ? { readOnly: true } : undefined,
        inputLabel: { shrink: true },
        select: readOnly
          ? undefined
          : {
              displayEmpty: true,
              renderValue: () =>
                currentOrganization ? (
                  currentOrganization.name
                ) : (
                  <em>{tCommon("organization.placeholder")}</em>
                ),
            },
      }}
      value={
        readOnly
          ? currentOrganization?.name || ""
          : currentOrganization?.slug || ""
      }
      onChange={readOnly ? undefined : handleChange}
    >
      {readOnly
        ? null
        : [
            <MenuItem disabled key="" value="">
              <em>{tCommon("organization.placeholder")}</em>
            </MenuItem>,
            ...organizations.map(({ id, name, slug }) => (
              <MenuItem key={id} value={slug}>
                {name}
              </MenuItem>
            )),
          ]}
    </StyledTextField>
  );
};

export default OrganizationSelect;
