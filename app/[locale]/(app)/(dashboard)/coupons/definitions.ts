import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  couponDiscountTypeValues,
  couponIssueTriggerValues,
  couponScopeValues,
} from "@/types/api";

export const useCouponFormSchema = () => {
  const tCoupons = useTranslations("coupons");
  const tValidation = useTranslations("validation");

  return z
    .object({
      applicableOrganizationIds: z.array(z.string()),
      code: z
        .string()
        .trim()
        .min(1, { error: tCoupons("code.required") })
        .max(64, { error: tCoupons("code.maxLength") }),
      discountType: z.enum(couponDiscountTypeValues),
      discountValue: z
        .string()
        .trim()
        .min(1, { error: tCoupons("discountValue.required") })
        .refine(
          (value) => Number(value) > 0,
          tCoupons("discountValue.invalid"),
        ),
      isActive: z.boolean(),
      isClaimable: z.boolean(),
      isPublic: z.boolean(),
      issueMinSpend: z.string().trim(),
      issueTrigger: z.enum(["none", ...couponIssueTriggerValues]),
      menuItemIds: z.array(z.string()),
      menuSectionIds: z.array(z.string()),
      minSubtotal: z.string().trim(),
      perUserLimit: z
        .string()
        .trim()
        .refine((value) => !value || Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        }),
      pointsCost: z
        .string()
        .trim()
        .refine((value) => !value || Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        }),
      scope: z.enum(couponScopeValues),
      totalLimit: z
        .string()
        .trim()
        .refine((value) => !value || Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        }),
      validFrom: z.string(),
      validThrough: z.string(),
    })
    .superRefine((data, ctx) => {
      if (
        data.discountType === "percentage" &&
        Number(data.discountValue) > 100
      ) {
        ctx.addIssue({
          code: "custom",
          message: tCoupons("discountValue.invalid"),
          path: ["discountValue"],
        });
      }

      if (
        data.issueTrigger === "spend" &&
        !data.pointsCost &&
        !Number(data.issueMinSpend)
      ) {
        ctx.addIssue({
          code: "custom",
          message: tCoupons("issueMinSpend.required"),
          path: ["issueMinSpend"],
        });
      }

      if (
        data.validFrom &&
        data.validThrough &&
        new Date(data.validThrough) <= new Date(data.validFrom)
      ) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("endsAt.afterStartsAt"),
          path: ["validThrough"],
        });
      }

      if (
        data.scope === "item" &&
        data.applicableOrganizationIds.length !== 1
      ) {
        ctx.addIssue({
          code: "custom",
          message: tCoupons("applicableOrganizationIds.notSelected"),
          path: ["applicableOrganizationIds"],
        });
      }

      if (
        data.scope === "item" &&
        data.menuItemIds.length === 0 &&
        data.menuSectionIds.length === 0
      ) {
        ctx.addIssue({
          code: "custom",
          message: tCoupons("scope.itemHint"),
          path: ["menuSectionIds"],
        });
        ctx.addIssue({
          code: "custom",
          message: tCoupons("scope.itemHint"),
          path: ["menuItemIds"],
        });
      }
    });
};

export type CouponFormValues = z.infer<ReturnType<typeof useCouponFormSchema>>;
