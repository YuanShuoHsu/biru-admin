import { useTranslations } from "next-intl";
import * as z from "zod";

export const useResolveInvoicePrintFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    printed: z.stringbool({ error: tValidation("printed.notSelected") }),
  });
};

export type ResolveInvoicePrintFormInput = z.input<
  ReturnType<typeof useResolveInvoicePrintFormSchema>
>;

export type ResolveInvoicePrintFormOutput = z.output<
  ReturnType<typeof useResolveInvoicePrintFormSchema>
>;
