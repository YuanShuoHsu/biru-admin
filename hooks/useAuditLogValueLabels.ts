import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  attendanceDayKindValues,
  attendanceLegalStatusValues,
  attendanceParentalReturnStatusValues,
  attendanceRequestKindValues,
  attendanceRequestStatusValues,
  attendanceTerminationReasonValues,
  createMenuItemDtoSuitableForDietValues,
  invoiceCarrierTypeValues,
  invoicePaymentStatusValues,
  invoiceStatusValues,
  invoiceTypeValues,
  itemAvailabilityValues,
  orderModeValues,
  orderRefundDtoScopeValues,
  orderResponseDtoPaymentMethodValues,
  orderStatusValues,
  organizationMemberResponseDtoRoleValues,
  payrollEarningCategoryValues,
  payrollStatementStatusValues,
  refundChannelValues,
  refundInvoiceActionValues,
  refundReasonCodeValues,
  refundStatusValues,
  servingTemperatureLevelValues,
  servingTemperatureValues,
  sweetnessLevelValues,
  statutoryLeaveKindValues,
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
  const tAttendance = useTranslations("attendance");
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
      "attendanceRequest.status": Object.fromEntries(
        attendanceRequestStatusValues.map((value) => [
          value,
          tAttendance(`status.options.${value}`),
        ]),
      ),
      "parentalReturn.status": Object.fromEntries(
        attendanceParentalReturnStatusValues.map((value) => [
          value,
          tAttendance(`status.options.${value}`),
        ]),
      ),
      "payslip.status": Object.fromEntries(
        payrollStatementStatusValues.map((value) => [
          value,
          tAttendance(`payrollStatus.options.${value}`),
        ]),
      ),
      availability: Object.fromEntries(
        itemAvailabilityValues.map((value) => [
          value,
          tMenus(`availability.options.${value}`),
        ]),
      ),
      availableModes: Object.fromEntries(
        orderModeValues.map((value) => [value, tOrder(`mode.${value}.label`)]),
      ),
      category: Object.fromEntries(
        payrollEarningCategoryValues.map((value) => [
          value,
          tAttendance(`earningCategory.options.${value}`),
        ]),
      ),
      channel: Object.fromEntries(
        refundChannelValues.map((value) => [
          value,
          tOrders(`detail.refunds.channel.${value}`),
        ]),
      ),
      dayKind: Object.fromEntries(
        attendanceDayKindValues.map((value) => [
          value,
          tAttendance(`dayKind.options.${value}`),
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
      "invoice.carrierType": Object.fromEntries(
        invoiceCarrierTypeValues.map((value) => [
          value,
          tOrder(`checkout.invoice.${value}`),
        ]),
      ),
      "invoice.paymentStatus": Object.fromEntries(
        invoicePaymentStatusValues.map((value) => [
          value,
          tAudit(`invoicePaymentStatus.${value}`),
        ]),
      ),
      "invoice.status": Object.fromEntries(
        invoiceStatusValues.map((value) => [
          value,
          tOrders(`invoiceStatusValue.${value}`),
        ]),
      ),
      "invoice.type": Object.fromEntries(
        invoiceTypeValues.map((value) => [
          value,
          tOrder(`checkout.invoice.${value}`),
        ]),
      ),
      invoiceAction: Object.fromEntries(
        refundInvoiceActionValues.map((value) => [
          value,
          tOrders(`detail.refunds.invoiceAction.${value}`),
        ]),
      ),
      kind: Object.fromEntries(
        attendanceRequestKindValues.map((value) => [
          value,
          tAttendance(`kind.options.${value}`),
        ]),
      ),
      legalStatus: Object.fromEntries(
        attendanceLegalStatusValues.map((value) => [
          value,
          tAttendance(`legalStatus.options.${value}`),
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
      statutoryKind: Object.fromEntries(
        statutoryLeaveKindValues.map((value) => [
          value,
          tAttendance(`statutoryKind.options.${value}`),
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
      terminationReason: Object.fromEntries(
        attendanceTerminationReasonValues.map((value) => [
          value,
          tAttendance(`terminationReason.options.${value}`),
        ]),
      ),
      unitCode: Object.fromEntries(
        unitCodeValues.map((value) => [value, tInventory(`units.${value}`)]),
      ),
    }),
    [
      tAdmins,
      tAttendance,
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
