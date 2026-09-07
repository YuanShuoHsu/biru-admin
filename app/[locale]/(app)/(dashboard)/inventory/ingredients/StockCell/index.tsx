import { Box } from "@mui/material";
import { useFormatter, useTranslations } from "next-intl";

import type { Ingredient } from "@/types/inventory";

import { stockParts } from "@/utils/ingredients";

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
    <Box component="span" whiteSpace="nowrap">
      {value}
      <Box component="span" visibility={hasSuffix ? undefined : "hidden"}>
        {suffix}
      </Box>
    </Box>
  );
};

export default StockCell;
