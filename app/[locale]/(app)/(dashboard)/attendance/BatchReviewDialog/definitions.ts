import { useTranslations } from "next-intl";
import * as z from "zod";

export const useBatchReviewFormSchema = (reasonRequired: boolean) => {
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

export type BatchReviewForm = z.infer<
  ReturnType<typeof useBatchReviewFormSchema>
>;
