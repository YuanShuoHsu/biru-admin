import { useTranslations } from "next-intl";
import * as z from "zod";

export const useDeferralFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reason.required") }),
  });
};

export type DeferralForm = z.infer<ReturnType<typeof useDeferralFormSchema>>;
