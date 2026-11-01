import { useTranslations } from "next-intl";
import * as z from "zod";

export const useResetInvoicePrintFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("resetReason.required") }),
  });
};

export type ResetInvoicePrintForm = z.infer<
  ReturnType<typeof useResetInvoicePrintFormSchema>
>;
