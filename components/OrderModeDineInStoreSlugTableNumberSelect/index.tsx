"use client";

import { useTranslations } from "next-intl";

import { PARTY_SIZE_MAX } from "@/constants/partySize";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField } from "@mui/material";

import type { OrderMode } from "@/types/orderMode";
import type { StoreSlug } from "@/types/stores";

interface OrderModeDineInStoreSlugTableNumberSelectProps {
  mode: OrderMode;
  storeSlug: StoreSlug;
  tableNumber: string;
}

const OrderModeDineInStoreSlugTableNumberSelect = ({
  mode,
  storeSlug,
  tableNumber,
}: OrderModeDineInStoreSlugTableNumberSelectProps) => {
  const tOrder = useTranslations("order");

  const router = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(
      `/order/${mode}/${storeSlug}?tableNumber=${tableNumber}&partySize=${event.target.value}`,
    );

  return (
    <TextField
      fullWidth
      label={tOrder("mode.dineIn.storeSlug.tableNumber.partySize.select.label")}
      name="partySize"
      onChange={handleChange}
      required
      select
      size="small"
      value={""}
    >
      {Array.from({ length: PARTY_SIZE_MAX }, (_, index) => index + 1).map(
        (count) => (
          <MenuItem key={count} value={count}>
            {tOrder(
              "mode.dineIn.storeSlug.tableNumber.partySize.select.value",
              {
                count,
              },
            )}
          </MenuItem>
        ),
      )}
    </TextField>
  );
};

export default OrderModeDineInStoreSlugTableNumberSelect;
