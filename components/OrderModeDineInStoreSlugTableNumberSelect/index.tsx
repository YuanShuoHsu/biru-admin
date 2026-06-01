"use client";

import { useTranslations } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";
import { PARTY_SIZE_MAX } from "@/constants/partySize";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField } from "@mui/material";

import type { Organization } from "@/types/organizations";

interface OrderModeDineInStoreSlugTableNumberSelectProps {
  organizationSlug: Organization["slug"];
  tableNumber: string;
}

const OrderModeDineInStoreSlugTableNumberSelect = ({
  organizationSlug,
  tableNumber,
}: OrderModeDineInStoreSlugTableNumberSelectProps) => {
  const router = useRouter();

  const tOrder = useTranslations("order");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(
      `/order/${ORDER_MODE.DineIn}/${organizationSlug}?tableNumber=${tableNumber}&partySize=${event.target.value}`,
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
      slotProps={{
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          renderValue: (selected) =>
            selected ? (
              tOrder(
                "mode.dineIn.storeSlug.tableNumber.partySize.select.value",
                { count: Number(selected) },
              )
            ) : (
              <em>
                {tOrder(
                  "mode.dineIn.storeSlug.tableNumber.partySize.select.placeholder",
                )}
              </em>
            ),
        },
      }}
      value={""}
    >
      <MenuItem disabled value="">
        <em>
          {tOrder(
            "mode.dineIn.storeSlug.tableNumber.partySize.select.placeholder",
          )}
        </em>
      </MenuItem>
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
