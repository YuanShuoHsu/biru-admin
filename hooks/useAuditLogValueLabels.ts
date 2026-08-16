import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  createMenuItemDtoSuitableForDietValues,
  itemAvailabilityValues,
  orderModeValues,
  orderResponseDtoPaymentMethodValues,
  orderStatusValues,
  userCouponSourceValues,
} from "@/types/api";

export const useAuditLogValueLabels = () => {
  const tCoupons = useTranslations("coupons");
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
      source: Object.fromEntries(
        userCouponSourceValues.map((value) => [
          value,
          tCoupons(`source.${value}`),
        ]),
      ),
      suitableForDiet: Object.fromEntries(
        createMenuItemDtoSuitableForDietValues.map((value) => [
          value,
          tOrder(`menuItem.diet.${value}`),
        ]),
      ),
    }),
    [tCoupons, tMenus, tOrder, tOrders],
  );
};
