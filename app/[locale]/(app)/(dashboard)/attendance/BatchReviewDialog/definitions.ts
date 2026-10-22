import { useTranslations } from "next-intl";
import * as z from "zod";

export const useBatchReviewFormSchema = ({
  acknowledgementRequired,
  reasonRequired,
}: {
  acknowledgementRequired: boolean;
  reasonRequired: boolean;
}) => {
  const tValidation = useTranslations("validation");

  return z.object({
    acknowledged: acknowledgementRequired
      ? z.literal(true, {
          error: tValidation("violationsAcknowledged.required"),
        })
      : z.boolean(),
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
