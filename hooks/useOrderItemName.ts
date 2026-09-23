import { useTranslations } from "next-intl";

import type { ServingTemperature } from "@/types/menus";
import type { OrderItemResponse } from "@/types/orders";

export const useOrderItemName = () => {
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const getServingTemperatureNames = (
    servingTemperature: ServingTemperature | null | undefined,
  ) =>
    servingTemperature
      ? [tOrder(`menuItem.servingTemperatures.${servingTemperature}`)]
      : [];

  return ({
    addOns,
    menuItemName,
    modifiers,
    servingTemperature,
  }: OrderItemResponse) => {
    const choiceNames = [
      ...getServingTemperatureNames(servingTemperature),
      ...(modifiers || []).map(({ modifierName }) => modifierName),
      ...(addOns || []).flatMap(
        ({
          menuItemName: addOnName,
          modifiers: addOnModifiers,
          servingTemperature: addOnServingTemperature,
        }) => [
          addOnName,
          ...getServingTemperatureNames(addOnServingTemperature),
          ...addOnModifiers.map(({ modifierName }) => modifierName),
        ],
      ),
    ].join(tCommon("delimiter"));

    return choiceNames
      ? `${menuItemName}${tCommon("parenthesisOpen")}${choiceNames}${tCommon("parenthesisClose")}`
      : menuItemName;
  };
};
