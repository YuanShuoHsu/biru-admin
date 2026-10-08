import { useTranslations } from "next-intl";

import type { OrderItemResponse } from "@/types/orders";

export const useOrderItemChoiceNames = () => {
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

  return (item: OrderItemResponse) =>
    [
      ...getServingTemperatureLevelNames(item),
      ...getSweetnessLevelNames(item),
      ...(item.modifiers || []).map(({ modifierName }) => modifierName),
      ...(item.addOns || []).flatMap((addOn) => [
        addOn.menuItemName,
        ...getServingTemperatureLevelNames(addOn),
        ...getSweetnessLevelNames(addOn),
        ...addOn.modifiers.map(({ modifierName }) => modifierName),
      ]),
    ].join(tCommon("delimiter"));
};

export const useOrderItemName = () => {
  const tCommon = useTranslations("common");

  const getOrderItemChoiceNames = useOrderItemChoiceNames();

  return (item: OrderItemResponse) => {
    const choiceNames = getOrderItemChoiceNames(item);

    return choiceNames
      ? `${item.menuItemName}${tCommon("parenthesisOpen")}${choiceNames}${tCommon("parenthesisClose")}`
      : item.menuItemName;
  };
};
