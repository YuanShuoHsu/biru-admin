import { useTranslations } from "next-intl";
import * as z from "zod";

export const useShiftTypeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      endTime: z.string().min(1, { error: tValidation("endsAt.required") }),
      name: z
        .string()
        .trim()
        .min(1, { error: tValidation("shiftTypeName.required") })
        .max(50, { error: tValidation("shiftTypeName.maxLength") }),
      startTime: z.string().min(1, { error: tValidation("startsAt.required") }),
    })
    .refine(({ endTime, startTime }) => endTime !== startTime, {
      error: tValidation("endTime.sameAsStartTime"),
      path: ["endTime"],
    });
};

export type ShiftTypeForm = z.infer<ReturnType<typeof useShiftTypeFormSchema>>;
