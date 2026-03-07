"use client";

import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField } from "@mui/material";

import type { OrderMode } from "@/types/orderMode";
import type { Store, StoreSlug } from "@/types/stores";

interface OrderModePickupStoreSlugSelectProps {
  mode: OrderMode;
  storeSlug: StoreSlug;
}

const OrderModePickupStoreSlugSelect = ({
  mode,
  storeSlug,
}: OrderModePickupStoreSlugSelectProps) => {
  const locale = useLocale();

  const router = useRouter();

  const { data: stores = [] } = useSWR<Store[]>("/api/stores");

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
      {stores.map(({ id, name, slug }) => (
        <MenuItem key={id} value={slug}>
          {name[locale]}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default OrderModePickupStoreSlugSelect;
