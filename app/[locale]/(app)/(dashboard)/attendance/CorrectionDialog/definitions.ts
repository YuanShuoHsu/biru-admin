import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCorrectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  const occurredAt = z
    .string()
    .min(1, { error: tValidation("occurredAt.required") })
    .refine((value) => new Date(value) <= new Date(), {
      error: tValidation("occurredAt.maxDateTime"),
    });

  return z
    .object({
      clockInAt: occurredAt,
      clockOutAt: occurredAt,
      reason: z
        .string()
        .trim()
        .min(1, { error: tValidation("reason.required") }),
    })
    .refine(
      ({ clockInAt, clockOutAt }) => new Date(clockOutAt) > new Date(clockInAt),
      {
        error: tValidation("clockOutAt.afterClockInAt"),
        path: ["clockOutAt"],
      },
    );
};

export type CorrectionForm = z.infer<
  ReturnType<typeof useCorrectionFormSchema>
>;
