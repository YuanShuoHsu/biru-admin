import { useTranslations } from "next-intl";
import { useCallback } from "react";

import type { OrderItemResponse } from "@/types/orders";

export const useOrderItemName = () => {
  const tCommon = useTranslations("common");

  return useCallback(
    ({ addOns, menuItemName, modifiers }: OrderItemResponse) => {
      const choiceNames = [
        ...(modifiers || []).map(({ modifierName }) => modifierName),
        ...(addOns || []).flatMap(
          ({ menuItemName: addOnName, modifiers: addOnModifiers }) => [
            addOnName,
            ...addOnModifiers.map(({ modifierName }) => modifierName),
          ],
        ),
      ].join(tCommon("delimiter"));

      return choiceNames
        ? `${menuItemName}${tCommon("parenthesisOpen")}${choiceNames}${tCommon("parenthesisClose")}`
        : menuItemName;
    },
    [tCommon],
  );
};
