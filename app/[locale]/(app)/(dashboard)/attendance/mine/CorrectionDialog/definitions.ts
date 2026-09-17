import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceEventActionValues } from "@/types/api";

export const useCorrectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    correctedEvents: z
      .array(
        z.object({
          action: z.enum(attendanceEventActionValues),
          occurredAt: z
            .string()
            .min(1, { error: tValidation("occurredAt.required") })
            .refine((value) => new Date(value) <= new Date(), {
              error: tValidation("occurredAt.maxDateTime"),
            }),
        }),
      )
      .min(2, { error: tValidation("correctedEvents.minLength") }),
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("reason.required") }),
  });
};

export type CorrectionForm = z.infer<
  ReturnType<typeof useCorrectionFormSchema>
>;
