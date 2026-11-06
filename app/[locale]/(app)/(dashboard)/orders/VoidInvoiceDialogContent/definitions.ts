import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  BUSINESS_NUMBER_PATTERN,
  isValidBusinessNumber,
} from "@/utils/businessNumber";

export const useVoidInvoiceFormSchema = (nameRequiresTaxId: boolean) => {
  const tOrders = useTranslations("orders");
  const tValidation = useTranslations("validation");

  return z
    .object({
      customerIdentifier: z
        .string()
        .trim()
        .refine((val) => !val || BUSINESS_NUMBER_PATTERN.test(val), {
          abort: true,
          error: tValidation("businessNumber.invalid"),
        })
        .refine((val) => !val || isValidBusinessNumber(val), {
          error: tValidation("businessNumber.checksum"),
        }),
      customerName: z.string().trim(),
      reason: z
        .string()
        .trim()
        .min(1, { error: tValidation("voidReason.required") }),
    })
    .superRefine((data, ctx) => {
      if (nameRequiresTaxId && data.customerName && !data.customerIdentifier)
        ctx.addIssue({
          code: "custom",
          message: tOrders(
            "actions.voidInvoice.customerName.requiresIdentifier",
          ),
          path: ["customerName"],
        });
    });
};

export type VoidInvoiceForm = z.infer<
  ReturnType<typeof useVoidInvoiceFormSchema>
>;
