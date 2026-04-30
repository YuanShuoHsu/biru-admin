"use client";

import { useTranslations } from "next-intl";

import { useOrganization } from "@/hooks/useOrganization";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField } from "@mui/material";

import type { OrderMode } from "@/types/orderMode";
import type { StoreSlug } from "@/types/stores";

interface OrderModePickupStoreSlugSelectProps {
  mode: OrderMode;
  storeSlug: StoreSlug;
}

const OrderModePickupStoreSlugSelect = ({
  mode,
  storeSlug,
}: OrderModePickupStoreSlugSelectProps) => {
  const router = useRouter();

  const organization = useOrganization();

  const tOrder = useTranslations("order");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(`/order/${mode}/${event.target.value}`);

  return (
    <TextField
      // error={!!state?.errors?.storeSlug}
      fullWidth
      // helperText={state?.errors?.storeSlug}
      label={tOrder("mode.pickup.select.label")}
      name="storeSlug"
      onChange={handleChange}
      required
      select
      size="small"
      value={storeSlug || ""}
    >
      {organization && (
        <MenuItem key={organization.id} value={organization.slug}>
          {organization.name}
        </MenuItem>
      )}
    </TextField>
  );
};

export default OrderModePickupStoreSlugSelect;
