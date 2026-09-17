import { useTranslations } from "next-intl";
import * as z from "zod";

export const useReturnFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    returnsAt: z.string().min(1, { error: tValidation("returnsAt.required") }),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reason.required") }),
  });
};

export type ReturnForm = z.infer<ReturnType<typeof useReturnFormSchema>>;
