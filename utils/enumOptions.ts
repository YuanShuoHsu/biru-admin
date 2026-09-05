import type { useTranslations } from "next-intl";

import { PLATFORM_ORGANIZATION_ID } from "@/constants/organizations";

import {
  auditActionValues,
  auditResourceValues,
  baseUnitCodeValues,
  couponIssueTriggerValues,
  couponScopeValues,
  invoiceStatusValues,
  invoiceTypeValues,
  itemAvailabilityValues,
  orderModeValues,
  orderResponseDtoModeValues,
  orderResponseDtoOrderStatusValues,
  orderResponseDtoPaymentMethodValues,
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
