import { useTranslations } from "next-intl";
import * as z from "zod";

export const useResolveInvoicePrintFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    printed: z.boolean({ error: tValidation("printed.notSelected") }),
  });
};

export type ResolveInvoicePrintForm = z.infer<
  ReturnType<typeof useResolveInvoicePrintFormSchema>
>;
