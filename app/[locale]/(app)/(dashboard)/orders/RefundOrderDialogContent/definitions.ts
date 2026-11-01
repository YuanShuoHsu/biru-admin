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
      quantities: z
        .record(z.string(), z.number())
        .refine(
          (quantities) =>
            [...getSelectedQuantities(quantities, remaining).values()].some(
              (quantity) => quantity > 0,
            ),
          { error: tOrders("actions.refund.selectAtLeastOne"), path: ["root"] },
        ),
      reason: z.string().trim(),
      reasonCode: z.string().pipe(
        z.enum(refundReasonCodeValues, {
          error: tValidation("refundReasonCode.notSelected"),
        }),
      ),
    })
    .superRefine((data, ctx) => {
      if (data.reasonCode === "other" && !data.reason)
        ctx.addIssue({
          code: "custom",
          message: tValidation("refundReason.required"),
          path: ["reason"],
        });
    });
};

export type RefundOrderFormInput = z.input<
  ReturnType<typeof useRefundOrderFormSchema>
>;

export type RefundOrderFormOutput = z.output<
  ReturnType<typeof useRefundOrderFormSchema>
>;
