import { useTranslations } from "next-intl";
import * as z from "zod";

export const useVoidInvoiceFormSchema = () => {
  const tOrders = useTranslations("orders");
  const tValidation = useTranslations("validation");

  return z.object({
    customerIdentifier: z
      .string()
      .trim()
      .regex(/^(\d{8})?$/, {
        error: tOrders("actions.voidInvoice.customerIdentifier.invalid"),
      }),
    customerName: z.string().trim(),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("voidReason.required") }),
  });
};

export type VoidInvoiceForm = z.infer<
  ReturnType<typeof useVoidInvoiceFormSchema>
>;
