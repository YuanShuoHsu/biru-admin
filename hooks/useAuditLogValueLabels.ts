import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  createMenuItemDtoSuitableForDietValues,
  itemAvailabilityValues,
  orderModeValues,
  orderResponseDtoPaymentMethodValues,
  orderStatusValues,
} from "@/types/api";

export const useAuditLogValueLabels = () => {
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  return useMemo<Record<string, Record<string, string>>>(
    () => ({
      availability: Object.fromEntries(
        itemAvailabilityValues.map((value) => [
          value,
          tMenus(`availability.options.${value}`),
        ]),
      ),
      availableModes: Object.fromEntries(
        orderModeValues.map((value) => [value, tOrder(`mode.${value}.label`)]),
      ),
      mode: Object.fromEntries(
        orderModeValues.map((value) => [value, tOrder(`mode.${value}.label`)]),
      ),
      orderStatus: Object.fromEntries(
        orderStatusValues.map((value) => [value, tOrders(`status.${value}`)]),
      ),
      paymentMethod: Object.fromEntries(
        orderResponseDtoPaymentMethodValues.map((value) => [
          value,
          tOrder(`checkout.payment.${value}`),
        ]),
      ),
      suitableForDiet: Object.fromEntries(
        createMenuItemDtoSuitableForDietValues.map((value) => [
          value,
          tOrder(`menuItem.diet.${value}`),
        ]),
      ),
    }),
    [tMenus, tOrder, tOrders],
  );
};
