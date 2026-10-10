import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  createMenuItemDtoSuitableForDietValues,
  itemAvailabilityValues,
  orderModeValues,
  orderRefundDtoScopeValues,
  orderResponseDtoPaymentMethodValues,
  orderStatusValues,
  organizationMemberResponseDtoRoleValues,
  refundChannelValues,
  refundInvoiceActionValues,
  refundReasonCodeValues,
  refundStatusValues,
  servingTemperatureLevelValues,
  servingTemperatureValues,
  sweetnessLevelValues,
  sweetnessValues,
  unitCodeValues,
  userCouponSourceValues,
  userRoleValues,
  waitlistTicketStatusValues,
} from "@/types/api";

import { routing } from "@/i18n/routing";

const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "canceled",
] as const;

export const useAuditLogValueLabels = () => {
  const tAdmins = useTranslations("admins");
  const tAudit = useTranslations("audit");
  const tCommon = useTranslations("common");
  const tCoupons = useTranslations("coupons");
  const tInventory = useTranslations("inventory");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");
  const tOrganizations = useTranslations("organizations");
  const tWaitlist = useTranslations("waitlist");

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
      channel: Object.fromEntries(
        refundChannelValues.map((value) => [
          value,
          tOrders(`detail.refunds.channel.${value}`),
        ]),
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
      invitationStatus: Object.fromEntries(
        INVITATION_STATUSES.map((value) => [
          value,
          tAudit(`invitationStatus.${value}`),
        ]),
      ),
      invoiceAction: Object.fromEntries(
        refundInvoiceActionValues.map((value) => [
          value,
          tOrders(`detail.refunds.invoiceAction.${value}`),
        ]),
      ),
      locale: Object.fromEntries(
        routing.locales.map((value) => [value, tCommon(`locales.${value}`)]),
      ),
      memberRole: Object.fromEntries(
        organizationMemberResponseDtoRoleValues.map((value) => [
          value,
          tOrganizations(`members.role.${value}`),
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
      reasonCode: Object.fromEntries(
        refundReasonCodeValues.map((value) => [
          value,
          tOrders(`detail.refunds.reasonCode.${value}`),
        ]),
      ),
      recommendedServingTemperatureLevel: Object.fromEntries(
        servingTemperatureLevelValues.map((value) => [
          value,
          tOrder(`menuItem.servingTemperatureLevels.${value}`),
        ]),
      ),
      recommendedSweetnessLevel: Object.fromEntries(
        sweetnessLevelValues.map((value) => [
          value,
          tOrder(`menuItem.sweetnessLevels.${value}`),
        ]),
      ),
      role: Object.fromEntries(
        userRoleValues.map((value) => [value, tAdmins(`role.${value}`)]),
      ),
      scope: Object.fromEntries(
        orderRefundDtoScopeValues.map((value) => [
          value,
          tOrders(`detail.refunds.scope.${value}`),
        ]),
      ),
      servingTemperatures: Object.fromEntries(
        servingTemperatureValues.map((value) => [
          value,
          tMenus(`items.servingTemperatures.options.${value}`),
        ]),
      ),
      status: Object.fromEntries([
        ...waitlistTicketStatusValues.map((value) => [
          value,
          tWaitlist(`status.${value}`),
        ]),
        ...refundStatusValues.map((value) => [
          value,
          tOrders(`detail.refunds.status.${value}`),
        ]),
      ]),
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
    [
      tAdmins,
      tAudit,
      tCommon,
      tCoupons,
      tInventory,
      tMenus,
      tOrder,
      tOrders,
      tOrganizations,
      tWaitlist,
    ],
  );
};
