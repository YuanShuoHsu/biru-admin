"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { usePathname, useRouter } from "@/i18n/navigation";

import type { Organization, OrganizationResponse } from "@/types/organizations";

import { MenuItem, TextField, styled } from "@mui/material";

import { getHref } from "@/utils/href";
import { getOrganizationLabel } from "@/utils/organizations";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

interface OrganizationSelectProps {
  organizations: Pick<
    Organization | OrganizationResponse,
    "closedAt" | "id" | "name" | "slug"
  >[];
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
  const searchParams = useSearchParams();

  const tCommon = useTranslations("common");

  const currentOrganization = organizations.find(
    ({ slug }) => slug === organizationSlug,
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    router.push(
      getHref(pathname, {
        organization: event.target.value,
        ...(searchParams.has("page") && DEFAULT_PAGINATION_QUERY),
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
                  getOrganizationLabel(tCommon, currentOrganization)
                ) : (
                  <em>{tCommon("organization.placeholder")}</em>
                ),
            },
      }}
      value={
        readOnly
          ? currentOrganization
            ? getOrganizationLabel(tCommon, currentOrganization)
            : ""
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
            ...organizations.map((organization) => (
              <MenuItem key={organization.id} value={organization.slug}>
                {getOrganizationLabel(tCommon, organization)}
              </MenuItem>
            )),
          ]}
    </StyledTextField>
  );
};

export default OrganizationSelect;
