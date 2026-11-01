import { useTranslations } from "next-intl";
import * as z from "zod";

export const useReprintOrderTicketFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    printerIds: z
      .array(z.string())
      .min(1, { error: tValidation("printerIds.notSelected") }),
  });
};

export type ReprintOrderTicketForm = z.infer<
  ReturnType<typeof useReprintOrderTicketFormSchema>
>;
