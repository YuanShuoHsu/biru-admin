"use client";

import { useTranslations } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";

import { useOrganizations } from "@/hooks/useOrganizations";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField } from "@mui/material";

const OrderModePickupStoreSlugSelect = () => {
  const router = useRouter();

  const organizations = useOrganizations();

  const tOrder = useTranslations("order");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(`/order/${event.target.value}?mode=${ORDER_MODE.Pickup}`);

  return (
    <TextField
      fullWidth
      label={tOrder("mode.pickup.select.label")}
      name="storeSlug"
      onChange={handleChange}
      required
      select
      size="small"
      value=""
    >
      {organizations.map(({ id, slug, name }) => (
        <MenuItem key={id} value={slug}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default OrderModePickupStoreSlugSelect;
