import { useTranslations } from "next-intl";
import * as z from "zod";

export const useReturnReviewFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reviewReason.required") }),
  });
};

export type ReturnReviewForm = z.infer<
  ReturnType<typeof useReturnReviewFormSchema>
>;
