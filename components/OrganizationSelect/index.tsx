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
  platformOption?: boolean;
  readOnly?: boolean;
}

const OrganizationSelect = ({
  organizations,
  organizationSlug,
  platformOption = false,
  readOnly = false,
}: OrganizationSelectProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const tCommon = useTranslations("common");

  const currentOrganization = organizations.find(
    ({ slug }) => slug === organizationSlug,
  );

  // 沒選店家在別處是「還沒選」，在平台模式下是一個真的選項，不能沿用 disabled 的提示項
  const emptyLabel = platformOption
    ? tCommon("organization.platform")
    : tCommon("organization.placeholder");

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
              renderValue: () => {
                if (currentOrganization) return currentOrganization.name;

                return platformOption ? emptyLabel : <em>{emptyLabel}</em>;
              },
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
            <MenuItem disabled={!platformOption} key="" value="">
              {platformOption ? emptyLabel : <em>{emptyLabel}</em>}
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
