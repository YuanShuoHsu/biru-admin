"use client";

import { useTranslations } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";
import { PARTY_SIZE_MAX } from "@/constants/partySize";

import { useRouter } from "@/i18n/navigation";

import { MenuItem, TextField, styled } from "@mui/material";

import type { Organization } from "@/types/organizations";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

interface OrderModeDineInStoreSlugTableNumberSelectProps {
  organizationSlug: Organization["slug"];
  partySize?: string;
  tableNumber: string;
}

const OrderModeDineInStoreSlugTableNumberSelect = ({
  organizationSlug,
  partySize,
  tableNumber,
}: OrderModeDineInStoreSlugTableNumberSelectProps) => {
  const router = useRouter();

  const tOrder = useTranslations("order");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    router.push(
      `/order/${ORDER_MODE.DineIn}/${organizationSlug}?tableNumber=${tableNumber}&partySize=${event.target.value}`,
    );

  return (
    <StyledTextField
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
      value={partySize ? Number(partySize) : ""}
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
    </StyledTextField>
  );
};

export default OrderModeDineInStoreSlugTableNumberSelect;
