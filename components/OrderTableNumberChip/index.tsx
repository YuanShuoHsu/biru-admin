"use client";

import { useTranslations } from "next-intl";

import { TableBar } from "@mui/icons-material";
import { Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledChip = styled(Chip)({
  borderRadius: 4,
  height: "auto",
});

interface OrderTableNumberChipProps {
  tableNumber: string;
}

const OrderTableNumberChip = ({ tableNumber }: OrderTableNumberChipProps) => {
  const tOrder = useTranslations("order");

  return (
    <StyledChip
      color="primary"
      icon={<TableBar />}
      label={
        <Stack>
          <Typography variant="caption">
            {tOrder("mode.dineIn.storeSlug.tableNumber.label")}
          </Typography>
          <Typography fontWeight="bold" variant="body2">
            {tableNumber}
          </Typography>
        </Stack>
      }
      variant="outlined"
    />
  );
};

export default OrderTableNumberChip;
