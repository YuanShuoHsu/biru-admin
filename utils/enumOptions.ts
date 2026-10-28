import type { useTranslations } from "next-intl";

import { PLATFORM_ORGANIZATION_ID } from "@/constants/organizations";

import {
  attendanceAnnualLeaveSettlementValues,
  attendanceDayKindValues,
  attendanceEmployeeStatusValues,
  attendanceEmploymentTypeValues,
  attendanceLegalStatusValues,
  attendanceParentalReturnStatusValues,
  attendanceRequestKindValues,
  attendanceRequestStatusValues,
  attendanceWorkPermitStatusValues,
  auditActionValues,
  auditResourceValues,
  baseUnitCodeValues,
  couponIssueTriggerValues,
  couponScopeValues,
  deletedRecordTableValues,
  inventoryTransactionReasonValues,
  invoiceStatusValues,
  invoiceTypeValues,
  itemAvailabilityValues,
  orderModeValues,
  orderResponseDtoModeValues,
  orderResponseDtoOrderStatusValues,
  orderResponseDtoPaymentMethodValues,
  organizationPointTransactionDtoTypeValues,
  payrollEarningCategoryValues,
  payrollStatementStatusValues,
  quantBotExecutorValues,
  quantBotModeValues,
  quantBotStatusValues,
  quantBotTypeValues,
  servingTemperatureValues,
  sweetnessValues,
  statutoryLeaveKindValues,
  userCouponSourceValues,
  userRoleValues,
  waitlistTicketStatusValues,
} from "@/types/api";
import type { OrganizationResponse } from "@/types/organizations";

import { getOrganizationLabel } from "@/utils/organizations";

export const getAuditLogEnumOptions = (
  tAudit: ReturnType<typeof useTranslations<"audit">>,
  tCommon: ReturnType<typeof useTranslations<"common">>,
  hasResourceColumn: boolean,
  organizations: OrganizationResponse[],
) => ({
  action: auditActionValues.map((value) => ({
    label: tAudit(`action.${value}`),
    value,
  })),
  organizationId: organizations.length
    ? [
        { label: tAudit("platform"), value: PLATFORM_ORGANIZATION_ID },
        ...organizations.map((organization) => ({
          label: getOrganizationLabel(tCommon, organization),
          value: organization.id,
        })),
      ]
    : [],
  resource: hasResourceColumn
    ? auditResourceValues.map((value) => ({
        label: tAudit(`resource.${value}`),
        value,
      }))
    : [],
});

export const getAdminEnumOptions = (
  tAdmins: ReturnType<typeof useTranslations<"admins">>,
) => ({
  banned: [
    { label: tAdmins("status.banned"), value: "true" },
    { label: tAdmins("status.active"), value: "false" },
  ],
  emailSubscribed: [
    { label: tAdmins("emailSubscribed.subscribed"), value: "true" },
    { label: tAdmins("emailSubscribed.unsubscribed"), value: "false" },
  ],
  role: userRoleValues.map((value) => ({
    label: tAdmins(`role.${value}`),
    value,
  })),
});

export const getBannerEnumOptions = (
  tBanners: ReturnType<typeof useTranslations<"banners">>,
) => ({
  isActive: [
    { label: tBanners("isActive.active"), value: "true" },
    { label: tBanners("isActive.inactive"), value: "false" },
  ],
});

export const getStorePhotoEnumOptions = (
  tStorePhotos: ReturnType<typeof useTranslations<"storePhotos">>,
) => ({
  isActive: [
    { label: tStorePhotos("isActive.active"), value: "true" },
    { label: tStorePhotos("isActive.inactive"), value: "false" },
  ],
});

export const getCouponEnumOptions = (
  tCoupons: ReturnType<typeof useTranslations<"coupons">>,
  tCommon: ReturnType<typeof useTranslations<"common">>,
  organizations: OrganizationResponse[],
) => ({
  applicableOrganizationIds: [
    { label: tCoupons("organizationScope.all"), value: "all" },
    ...organizations.map((organization) => ({
      label: getOrganizationLabel(tCommon, organization),
      value: organization.id,
    })),
  ],
  distribution: [
    { label: tCoupons("isPublic.label"), value: "isPublic" },
    { label: tCoupons("isClaimable.label"), value: "isClaimable" },
    ...couponIssueTriggerValues.map((value) => ({
      label: tCoupons(`issueTrigger.${value}`),
      value,
    })),
  ],
  isActive: [
    { label: tCoupons("isActive.active"), value: "true" },
    { label: tCoupons("isActive.inactive"), value: "false" },
  ],
  scope: couponScopeValues.map((value) => ({
    label: tCoupons(`scope.${value}`),
    value,
  })),
});

export const getCouponRecipientEnumOptions = (
  tCoupons: ReturnType<typeof useTranslations<"coupons">>,
) => ({
  source: userCouponSourceValues.map((value) => ({
    label: tCoupons(`source.${value}`),
    value,
  })),
  usedAt: [
    { label: tCoupons("recipients.used"), value: "used" },
    { label: tCoupons("recipients.unused"), value: "unused" },
  ],
});

export const getDeletedRecordEnumOptions = (
  tDeletedRecords: ReturnType<typeof useTranslations<"deletedRecords">>,
) => ({
  tableName: deletedRecordTableValues.map((value) => ({
    label: tDeletedRecords(`table.${value}`),
    value,
  })),
});

export const getMenuEnumOptions = (
  tMenus: ReturnType<typeof useTranslations<"menus">>,
  tOrder: ReturnType<typeof useTranslations<"order">>,
) => ({
  availability: itemAvailabilityValues.map((value) => ({
    label: tMenus(`availability.options.${value}`),
    value,
  })),
  availableModes: orderModeValues.map((value) => ({
    label: tOrder(`mode.${value}.label`),
    value,
  })),
  servingTemperatures: servingTemperatureValues.map((value) => ({
    label: tMenus(`items.servingTemperatures.options.${value}`),
    value,
  })),
  sweetness: sweetnessValues.map((value) => ({
    label: tMenus(`items.sweetness.options.${value}`),
    value,
  })),
});

export const getOrderEnumOptions = (
  tOrder: ReturnType<typeof useTranslations<"order">>,
  tOrders: ReturnType<typeof useTranslations<"orders">>,
) => ({
  mode: orderResponseDtoModeValues.map((value) => ({
    label: tOrder(`mode.${value}.label`),
    value,
  })),
  orderStatus: orderResponseDtoOrderStatusValues.map((value) => ({
    label: tOrders(`status.${value}`),
    value,
  })),
  paymentMethod: orderResponseDtoPaymentMethodValues.map((value) => ({
    label: tOrder(`checkout.payment.${value}`),
    value,
  })),
  invoiceType: invoiceTypeValues.map((value) => ({
    label: tOrder(`checkout.invoice.${value}`),
    value,
  })),
  invoiceStatus: invoiceStatusValues.map((value) => ({
    label: tOrders(`invoiceStatusValue.${value}`),
    value,
  })),
});

export const getIngredientEnumOptions = (
  tInventory: ReturnType<typeof useTranslations<"inventory">>,
) => ({
  unitCode: baseUnitCodeValues.map((value) => ({
    label: tInventory(`units.${value}`),
    value,
  })),
});

export const getInventoryTransactionEnumOptions = (
  tInventory: ReturnType<typeof useTranslations<"inventory">>,
) => ({
  reason: inventoryTransactionReasonValues.map((value) => ({
    label: tInventory(`transactions.reason.options.${value}`),
    value,
  })),
});

export const getPointTransactionEnumOptions = (
  tAuth: ReturnType<typeof useTranslations<"auth">>,
) => ({
  type: organizationPointTransactionDtoTypeValues.map((value) => ({
    label: tAuth(`points.type.${value}`),
    value,
  })),
});

export const getAttendanceDayKindEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  dayKind: attendanceDayKindValues.map((value) => ({
    label: tAttendance(`dayKind.options.${value}`),
    value,
  })),
});

export const getAttendanceRequestEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  kind: attendanceRequestKindValues.map((value) => ({
    label: tAttendance(`kind.options.${value}`),
    value,
  })),
  status: attendanceRequestStatusValues.map((value) => ({
    label: tAttendance(`status.options.${value}`),
    value,
  })),
});

export const getAttendanceEmployeeEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  employmentType: attendanceEmploymentTypeValues.map((value) => ({
    label: tAttendance(`employmentType.options.${value}`),
    value,
  })),
  legalStatus: attendanceLegalStatusValues.map((value) => ({
    label: tAttendance(`legalStatus.options.${value}`),
    value,
  })),
  status: attendanceEmployeeStatusValues.map((value) => ({
    label: tAttendance(`employeeStatus.options.${value}`),
    value,
  })),
  workPermitStatus: attendanceWorkPermitStatusValues.map((value) => ({
    label: tAttendance(`workPermits.${value}`),
    value,
  })),
});

export const getAttendanceLeaveTypeNameEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  leaveTypeStatutoryKind: statutoryLeaveKindValues
    .filter((value) => value !== "custom")
    .map((value) => ({
      label: tAttendance(`statutoryKind.names.${value}`),
      value,
    })),
});

export const getPayrollEarningTypeEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  category: payrollEarningCategoryValues.map((value) => ({
    label: tAttendance(`earningCategory.options.${value}`),
    value,
  })),
});

export const getAttendanceLeaveTypeEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  statutoryKind: statutoryLeaveKindValues.map((value) => ({
    label: tAttendance(`statutoryKind.options.${value}`),
    value,
  })),
});

export const getAttendanceAnnualLeaveNoticeEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  settlement: attendanceAnnualLeaveSettlementValues.map((value) => ({
    label: tAttendance(`annualLeaveNotices.settlements.${value}`),
    value,
  })),
});

export const getAttendanceParentalReturnEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  status: attendanceParentalReturnStatusValues.map((value) => ({
    label: tAttendance(`status.options.${value}`),
    value,
  })),
});

export const getPayrollStatementEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  status: payrollStatementStatusValues.map((value) => ({
    label: tAttendance(`payrollStatus.options.${value}`),
    value,
  })),
});

export const getQuantBotEnumOptions = (
  tBots: ReturnType<typeof useTranslations<"quant.bots">>,
) => ({
  executor: quantBotExecutorValues.map((value) => ({
    label: tBots(`executors.${value}.label`),
    value,
  })),
  mode: quantBotModeValues.map((value) => ({
    label: tBots(`modes.${value}`),
    value,
  })),
  // 建立後尚未啟動的機器人由後端回報為 notStarted
  status: (["notStarted", ...quantBotStatusValues] as const).map((value) => ({
    label: tBots(`statuses.${value}`),
    value,
  })),
  type: quantBotTypeValues.map((value) => ({
    label: tBots(`types.${value}`),
    value,
  })),
});

export const getWaitlistEnumOptions = (
  tWaitlist: ReturnType<typeof useTranslations<"waitlist">>,
) => ({
  status: waitlistTicketStatusValues.map((value) => ({
    label: tWaitlist(`status.${value}`),
    value,
  })),
});
