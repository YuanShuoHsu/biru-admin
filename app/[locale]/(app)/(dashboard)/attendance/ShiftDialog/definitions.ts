import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceScheduledDayKindValues } from "@/types/api";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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
      breaks: z.array(
        z.object({
          startTime: z
            .string()
            .regex(TIME_PATTERN, { error: tValidation("startTime.invalid") }),
          endTime: z
            .string()
            .regex(TIME_PATTERN, { error: tValidation("endTime.invalid") }),
        }),
      ),
      dayKind: z.enum(attendanceScheduledDayKindValues),
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
