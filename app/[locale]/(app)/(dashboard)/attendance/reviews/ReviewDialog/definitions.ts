import { useTranslations } from "next-intl";
import * as z from "zod";

import { emergencyWorkDtoCauseValues } from "@/types/api";

export const useReviewFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      cause: z.enum(emergencyWorkDtoCauseValues).or(z.literal("")),
      emergencyWork: z.boolean(),
      makeupEndsAt: z.string(),
      makeupStartsAt: z.string(),
      medicalCertified: z.boolean(),
      reason: z
        .string()
        .trim()
        .min(1, { error: tValidation("reviewReason.required") }),
      reportedAt: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!data.emergencyWork) return;

      const requiredMessages = {
        cause: tValidation("cause.notSelected"),
        makeupEndsAt: tValidation("makeupEndsAt.required"),
        makeupStartsAt: tValidation("makeupStartsAt.required"),
        reportedAt: tValidation("reportedAt.required"),
      };

      for (const field of Object.keys(requiredMessages) as Array<
        keyof typeof requiredMessages
      >)
        if (!data[field])
          ctx.addIssue({
            code: "custom",
            message: requiredMessages[field],
            path: [field],
          });

      if (
        data.makeupStartsAt &&
        data.makeupEndsAt &&
        new Date(data.makeupEndsAt) <= new Date(data.makeupStartsAt)
      )
        ctx.addIssue({
          code: "custom",
          message: tValidation("makeupEndsAt.afterMakeupStartsAt"),
          path: ["makeupEndsAt"],
        });
    });
};

export type ReviewForm = z.infer<ReturnType<typeof useReviewFormSchema>>;
