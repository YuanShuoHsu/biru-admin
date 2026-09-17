import type { useTranslations } from "next-intl";

import { PLATFORM_ORGANIZATION_ID } from "@/constants/organizations";

import {
  attendanceDayKindValues,
  attendanceParentalReturnResponseDtoStatusValues,
  attendanceRequestResponseDtoKindValues,
  attendanceRequestResponseDtoStatusValues,
  auditActionValues,
  auditResourceValues,
  baseUnitCodeValues,
  couponIssueTriggerValues,
  couponScopeValues,
  inventoryTransactionReasonValues,
  invoiceStatusValues,
  invoiceTypeValues,
  itemAvailabilityValues,
  orderModeValues,
  orderResponseDtoModeValues,
  orderResponseDtoOrderStatusValues,
  orderResponseDtoPaymentMethodValues,
  payrollStatementResponseDtoStatusValues,
  statutoryLeaveKindValues,
  userCouponSourceValues,
  userRoleValues,
} from "@/types/api";
import type { OrganizationResponse } from "@/types/organizations";

export const getAuditLogEnumOptions = (
  tAudit: ReturnType<typeof useTranslations<"audit">>,
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
        ...organizations.map(({ id, name }) => ({ label: name, value: id })),
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

export const getCouponEnumOptions = (
  tCoupons: ReturnType<typeof useTranslations<"coupons">>,
  organizations: OrganizationResponse[],
) => ({
  applicableOrganizationIds: [
    { label: tCoupons("organizationScope.all"), value: "all" },
    ...organizations.map(({ id, name }) => ({ label: name, value: id })),
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
  kind: attendanceRequestResponseDtoKindValues.map((value) => ({
    label: tAttendance(`kind.options.${value}`),
    value,
  })),
  status: attendanceRequestResponseDtoStatusValues.map((value) => ({
    label: tAttendance(`status.options.${value}`),
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

export const getAttendanceParentalReturnEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  status: attendanceParentalReturnResponseDtoStatusValues.map((value) => ({
    label: tAttendance(`status.options.${value}`),
    value,
  })),
});

export const getPayrollStatementEnumOptions = (
  tAttendance: ReturnType<typeof useTranslations<"attendance">>,
) => ({
  status: payrollStatementResponseDtoStatusValues.map((value) => ({
    label: tAttendance(`payrollStatus.options.${value}`),
    value,
  })),
});
