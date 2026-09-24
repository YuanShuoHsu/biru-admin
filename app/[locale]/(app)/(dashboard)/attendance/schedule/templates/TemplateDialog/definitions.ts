import { useTranslations } from "next-intl";
import * as z from "zod";

import { attendanceDayKindValues } from "@/types/api";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const useTemplateFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("templateName.required") }),
    employeeId: z
      .string()
      .min(1, { error: tValidation("employee.notSelected") }),
    weekday: z.number().int().min(0).max(6),
    startTime: z
      .string()
      .regex(TIME_PATTERN, { error: tValidation("startTime.invalid") }),
    endTime: z
      .string()
      .regex(TIME_PATTERN, { error: tValidation("endTime.invalid") }),
    nextDay: z.boolean(),
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
    dayKind: z.enum(attendanceDayKindValues),
  });
};

export type TemplateForm = z.infer<ReturnType<typeof useTemplateFormSchema>>;
