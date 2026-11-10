import { useTranslations } from "next-intl";
import * as z from "zod";

export const useOrderTicketPrinterFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("printerName.required") }),
  });
};

export type OrderTicketPrinterForm = z.infer<
  ReturnType<typeof useOrderTicketPrinterFormSchema>
>;
