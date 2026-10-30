import { useTranslations } from "next-intl";
import * as z from "zod";

import { refundReasonCodeValues } from "@/types/api";

export const getSelectedQuantities = (
  quantities: Record<string, number>,
  remaining: Map<string, number>,
) =>
  Object.keys(quantities).length
    ? new Map(Object.entries(quantities))
    : remaining;

export const useRefundOrderFormSchema = (remaining: Map<string, number>) => {
  const tOrders = useTranslations("orders");
  const tValidation = useTranslations("validation");

  return z
    .object({
      quantities: z.record(z.string(), z.number()),
      reason: z.string().trim(),
      reasonCode: z.enum(refundReasonCodeValues).or(z.literal("")),
    })
    .superRefine((data, ctx) => {
      if (
        ![...getSelectedQuantities(data.quantities, remaining).values()].some(
          (quantity) => quantity > 0,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: tOrders("actions.refund.selectAtLeastOne"),
          path: ["quantities"],
        });

      if (!data.reasonCode)
        ctx.addIssue({
          code: "custom",
          message: tValidation("refundReasonCode.notSelected"),
          path: ["reasonCode"],
        });

      if (data.reasonCode === "other" && !data.reason)
        ctx.addIssue({
          code: "custom",
          message: tValidation("refundReason.required"),
          path: ["reason"],
        });
    });
};

export type RefundOrderForm = z.infer<
  ReturnType<typeof useRefundOrderFormSchema>
>;
