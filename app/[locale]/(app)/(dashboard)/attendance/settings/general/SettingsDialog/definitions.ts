import { useTranslations } from "next-intl";
import * as z from "zod";

import { ALLOWED_IPS_MAX } from "@/constants/attendance";

export const useSettingsFormSchema = () => {
  const tValidation = useTranslations("validation");

  const range = (min: number, max: number) =>
    z
      .number()
      .min(min, { error: tValidation("number.min", { min }) })
      .max(max, { error: tValidation("number.max", { max }) });

  return z
    .object({
      allowedIps: z
        .array(
          z.object({
            value: z
              .string()
              .trim()
              .min(1, { error: tValidation("allowedIps.required") }),
          }),
        )
        .min(1, { error: tValidation("allowedIps.required") })
        .max(ALLOWED_IPS_MAX, {
          error: tValidation("allowedIps.max", { max: ALLOWED_IPS_MAX }),
        }),
      graceMinutes: range(0, 60),
      laborInsuranceUnitCode: z
        .string()
        .trim()
        .regex(/^(\d{8}[A-Z])?$/, {
          error: tValidation("laborInsuranceUnitCode.invalid"),
        }),
      occupationalAccidentRate: range(0.0001, 10).nullable(),
      overtimeExtensionPeriods: z.array(
        z.object({
          value: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
            error: tValidation("overtimeExtensionPeriod.invalid"),
          }),
        }),
      ),
      latitude: range(-90, 90).nullable(),
      longitude: range(-180, 180).nullable(),
      radiusMeters: range(10, 10000),
    })
    .superRefine((data, ctx) => {
      for (const field of ["latitude", "longitude"] as const)
        if (data[field] === null)
          ctx.addIssue({
            code: "custom",
            message: tValidation(`${field}.required`),
            path: [field],
          });
    });
};

export type SettingsForm = z.infer<ReturnType<typeof useSettingsFormSchema>>;
