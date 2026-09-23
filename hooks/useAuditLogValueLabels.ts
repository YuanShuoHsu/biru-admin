import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  createMenuItemDtoSuitableForDietValues,
  itemAvailabilityValues,
  orderModeValues,
  orderResponseDtoPaymentMethodValues,
  orderStatusValues,
  servingTemperatureValues,
  sweetnessLevelValues,
  sweetnessValues,
  unitCodeValues,
  userCouponSourceValues,
} from "@/types/api";

export const useAuditLogValueLabels = () => {
  const tCoupons = useTranslations("coupons");
  const tInventory = useTranslations("inventory");
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
      eligibleQuantityUnitCode: Object.fromEntries(
        unitCodeValues.map((value) => [value, tInventory(`units.${value}`)]),
      ),
      fixedSweetnessLevel: Object.fromEntries(
        sweetnessLevelValues.map((value) => [
          value,
          tOrder(`menuItem.sweetnessLevels.${value}`),
        ]),
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
      servingTemperatures: Object.fromEntries(
        servingTemperatureValues.map((value) => [
          value,
          tMenus(`items.servingTemperatures.options.${value}`),
        ]),
      ),
      suitableForDiet: Object.fromEntries(
        createMenuItemDtoSuitableForDietValues.map((value) => [
          value,
          tOrder(`menuItem.diet.${value}`),
        ]),
      ),
      sweetness: Object.fromEntries(
        sweetnessValues.map((value) => [
          value,
          tMenus(`items.sweetness.options.${value}`),
        ]),
      ),
      unitCode: Object.fromEntries(
        unitCodeValues.map((value) => [value, tInventory(`units.${value}`)]),
      ),
    }),
    [tCoupons, tInventory, tMenus, tOrder, tOrders],
  );
};
