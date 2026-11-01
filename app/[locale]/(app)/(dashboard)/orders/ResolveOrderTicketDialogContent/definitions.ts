import { useTranslations } from "next-intl";
import * as z from "zod";

export const useResolveOrderTicketFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    printed: z.stringbool({ error: tValidation("printed.notSelected") }),
  });
};

export type ResolveOrderTicketFormInput = z.input<
  ReturnType<typeof useResolveOrderTicketFormSchema>
>;

export type ResolveOrderTicketFormOutput = z.output<
  ReturnType<typeof useResolveOrderTicketFormSchema>
>;
