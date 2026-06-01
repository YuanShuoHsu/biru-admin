"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

import { useOrganizations } from "@/hooks/organizations";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField, styled } from "@mui/material";

import type { RouteParams } from "@/types/routeParams";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

const OrderOrganizationSlugSelect = () => {
  const router = useRouter();

  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const organizations = useOrganizations();

  const tOrder = useTranslations("order");

  const isDineIn = mode === ORDER_MODE.DineIn;

  const currentOrg = organizations.find(
    ({ slug }) => slug === organizationSlug,
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(`/order/${ORDER_MODE.Pickup}/${event.target.value}`);

  return (
    <StyledTextField
      fullWidth
      label={tOrder(
        isDineIn ? "organizationSlug.label" : "organizationSlug.select.label",
      )}
      name={isDineIn ? undefined : "organizationSlug"}
      onChange={isDineIn ? undefined : handleChange}
      required={!isDineIn}
      select={!isDineIn}
      size="small"
      slotProps={{
        input: isDineIn ? { readOnly: true } : undefined,
        inputLabel: { shrink: true },
        select: isDineIn
          ? undefined
          : {
              displayEmpty: true,
              renderValue: (selected) => {
                const organization = organizations.find(
                  ({ slug }) => slug === selected,
                );

                return organization ? (
                  organization.name
                ) : (
                  <em>{tOrder("organizationSlug.select.placeholder")}</em>
                );
              },
            },
      }}
      value={isDineIn ? currentOrg?.name || "" : organizationSlug || ""}
    >
      {isDineIn
        ? null
        : [
            <MenuItem disabled key="" value="">
              <em>{tOrder("organizationSlug.select.placeholder")}</em>
            </MenuItem>,
            ...organizations.map(({ id, slug, name }) => (
              <MenuItem key={id} value={slug}>
                {name}
              </MenuItem>
            )),
          ]}
    </StyledTextField>
  );
};

export default OrderOrganizationSlugSelect;
