import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceDayKindValues } from "@/types/api";

export const useShiftFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      employeeId: z
        .string()
        .min(1, { error: tValidation("employee.notSelected") }),
      startsAt: z.string().min(1, { error: tValidation("startsAt.required") }),
      endsAt: z.string().min(1, { error: tValidation("endsAt.required") }),
      paidBreak: z.boolean(),
      dayKind: z.enum(attendanceDayKindValues),
      repeatWeeks: z
        .number()
        .int({ error: tValidation("number.integer") })
        .min(1, { error: tValidation("number.min", { min: 1 }) })
        .max(12, { error: tValidation("number.max", { max: 12 }) }),
    })
    .refine(({ endsAt, startsAt }) => new Date(endsAt) > new Date(startsAt), {
      error: tValidation("endsAt.afterStartsAt"),
      path: ["endsAt"],
    });
};

export type ShiftForm = z.infer<ReturnType<typeof useShiftFormSchema>>;
