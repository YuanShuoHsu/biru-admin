import { useTranslations } from "next-intl";
import * as z from "zod";

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
        .string()
        .trim()
        .min(1, { error: tValidation("allowedIps.required") }),
      graceMinutes: range(0, 60),
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
