import { useTranslations } from "next-intl";
import * as z from "zod";

export const useReturnReviewFormSchema = (reasonRequired: boolean) => {
  const tValidation = useTranslations("validation");

  return z.object({
    reason: reasonRequired
      ? z
          .string()
          .trim()
          .min(1, { error: tValidation("reviewReason.required") })
      : z.string().trim(),
  });
};

export type ReturnReviewForm = z.infer<
  ReturnType<typeof useReturnReviewFormSchema>
>;
