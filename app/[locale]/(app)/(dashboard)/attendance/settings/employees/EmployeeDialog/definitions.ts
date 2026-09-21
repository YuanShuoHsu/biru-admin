import { useTranslations } from "next-intl";
import * as z from "zod";

import type { AttendanceEmployee } from "@/types/attendance";

export const useEmployeeFormSchema = (employee?: AttendanceEmployee) => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      userId: z.string(),
      partTime: z.boolean(),
      hiredAt: z.string().min(1, { error: tValidation("hiredAt.required") }),
      terminatedAt: z.string(),
      enabled: z.boolean(),
      weeklyMinutes: z
        .number()
        .int({ error: tValidation("number.integer") })
        .min(1, { error: tValidation("number.min", { min: 1 }) })
        .max(2400, { error: tValidation("number.max", { max: 2400 }) }),
      weeklyMinutesFrom: z.string(),
    })
    .refine(
      ({ partTime, weeklyMinutes }) => !partTime || weeklyMinutes < 2400,
      {
        error: tValidation("weeklyMinutes.partTime"),
        path: ["weeklyMinutes"],
      },
    )
    .refine(
      ({ hiredAt, terminatedAt }) =>
        !terminatedAt || new Date(terminatedAt) > new Date(hiredAt),
      {
        error: tValidation("terminatedAt.afterHiredAt"),
        path: ["terminatedAt"],
      },
    )
    .refine(
      ({ weeklyMinutes, weeklyMinutesFrom }) =>
        !employee ||
        weeklyMinutes === employee.weeklyMinutes ||
        !!weeklyMinutesFrom,
      {
        error: tValidation("weeklyMinutesFrom.required"),
        path: ["weeklyMinutesFrom"],
      },
    )
    .refine(
      ({ hiredAt, weeklyMinutesFrom }) =>
        !weeklyMinutesFrom || new Date(weeklyMinutesFrom) >= new Date(hiredAt),
      {
        error: tValidation("weeklyMinutesFrom.notBeforeHiredAt"),
        path: ["weeklyMinutesFrom"],
      },
    );
};

export type EmployeeForm = z.infer<ReturnType<typeof useEmployeeFormSchema>>;
