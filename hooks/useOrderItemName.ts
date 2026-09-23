import { useTranslations } from "next-intl";

import type { OrderItemResponse } from "@/types/orders";

export const useOrderItemName = () => {
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const getServingTemperatureLevelNames = ({
    servingTemperatureLevel,
  }: Pick<OrderItemResponse, "servingTemperatureLevel">) =>
    servingTemperatureLevel
      ? [tOrder(`menuItem.servingTemperatureLevels.${servingTemperatureLevel}`)]
      : [];

  const getSweetnessLevelNames = ({
    sweetnessLevel,
  }: Pick<OrderItemResponse, "sweetnessLevel">) =>
    sweetnessLevel
      ? [tOrder(`menuItem.sweetnessLevels.${sweetnessLevel}`)]
      : [];

  return (item: OrderItemResponse) => {
    const { addOns, menuItemName, modifiers } = item;
    const choiceNames = [
      ...getServingTemperatureLevelNames(item),
      ...getSweetnessLevelNames(item),
      ...(modifiers || []).map(({ modifierName }) => modifierName),
      ...(addOns || []).flatMap((addOn) => [
        addOn.menuItemName,
        ...getServingTemperatureLevelNames(addOn),
        ...getSweetnessLevelNames(addOn),
        ...addOn.modifiers.map(({ modifierName }) => modifierName),
      ]),
    ].join(tCommon("delimiter"));

    return choiceNames
      ? `${menuItemName}${tCommon("parenthesisOpen")}${choiceNames}${tCommon("parenthesisClose")}`
      : menuItemName;
  };
};
