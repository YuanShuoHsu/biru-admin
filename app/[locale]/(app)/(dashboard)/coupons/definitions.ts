import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCouponFormSchema = () => {
  const tCoupons = useTranslations("coupons");

  return z
    .object({
      code: z
        .string()
        .trim()
        .min(1, { error: tCoupons("code.required") }),
      discountType: z.enum(["fixed", "percentage"]),
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
      issueTrigger: z.enum(["none", "signup", "birthday", "spend"]),
      menuItemIds: z.array(z.string()),
      menuSectionIds: z.array(z.string()),
      minSubtotal: z.string().trim(),
      perUserLimit: z.string().trim(),
      scope: z.enum(["item", "order"]),
      totalLimit: z.string().trim(),
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

      if (data.issueTrigger === "spend" && !Number(data.issueMinSpend)) {
        ctx.addIssue({
          code: "custom",
          message: tCoupons("issueMinSpend.required"),
          path: ["issueMinSpend"],
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
