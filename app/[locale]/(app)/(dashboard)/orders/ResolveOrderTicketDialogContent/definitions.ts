import { useTranslations } from "next-intl";
import * as z from "zod";

export const useResolveOrderTicketFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    printed: z.boolean({ error: tValidation("printed.notSelected") }),
  });
};

export type ResolveOrderTicketForm = z.infer<
  ReturnType<typeof useResolveOrderTicketFormSchema>
>;
