import { useTranslations } from "next-intl";

import type { ApiOrderMode } from "@/types/orderMode";

export const useOrderModeLabel = () => {
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  return (mode: ApiOrderMode, tableNumber: number | null | undefined) =>
    [
      tOrder(`mode.${mode}.label`),
      tableNumber && tOrder("mode.dineIn.tableNumber.value", { tableNumber }),
    ]
      .filter(Boolean)
      .join(tCommon("delimiter"));
};
