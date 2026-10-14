import { Box, type BoxProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useFormatter, useTranslations } from "next-intl";

import type { Ingredient } from "@/types/inventory";

import { stockParts } from "@/utils/ingredients";

const StockBox = styled(Box)<BoxProps>({
  whiteSpace: "nowrap",
});

const SuffixBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "hasSuffix",
})<BoxProps & { hasSuffix: boolean }>(({ hasSuffix }) => ({
  ...(!hasSuffix && {
    visibility: "hidden",
  }),
}));

interface StockCellProps {
  ingredient: Ingredient;
  quantity: number;
}

const StockCell = ({ ingredient, quantity }: StockCellProps) => {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");
  const { hasSuffix, suffix, value } = stockParts(quantity, ingredient, {
    format,
    tCommon,
    tInventory,
  });

  return (
    <StockBox component="span">
      {value}
      <SuffixBox component="span" hasSuffix={hasSuffix}>
        {suffix}
      </SuffixBox>
    </StockBox>
  );
};

export default StockCell;
