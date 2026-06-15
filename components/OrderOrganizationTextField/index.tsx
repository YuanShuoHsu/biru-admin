"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

import { useRouter } from "@/i18n/navigation";

import type { OrganizationResponse } from "@/types/organizations";

import { MenuItem, TextField, styled } from "@mui/material";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

interface OrderOrganizationTextFieldProps {
  organizations: OrganizationResponse[];
  organizationSlug: string;
}

const OrderOrganizationTextField = ({
  organizations,
  organizationSlug,
}: OrderOrganizationTextFieldProps) => {
  const { mode } = useParams();

  const router = useRouter();

  const tOrder = useTranslations("order");

  const isDineIn = mode === ORDER_MODE.DineIn;

  const currentOrganization = organizations.find(
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
                const selectedOrganization = organizations.find(
                  ({ slug }) => slug === selected,
                );

                return selectedOrganization ? (
                  selectedOrganization.name
                ) : (
                  <em>{tOrder("organizationSlug.select.placeholder")}</em>
                );
              },
            },
      }}
      value={
        isDineIn
          ? currentOrganization?.name || ""
          : currentOrganization?.slug || ""
      }
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

export default OrderOrganizationTextField;
