import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdatePointSettingFormSchema = () => {
  const tPointSettings = useTranslations("pointSettings");

  return z.object({
    accountingValuePerPoint: z.string().trim(),
    amountPerPoint: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || Number(value) > 0,
        tPointSettings("amountPerPoint.invalid"),
      ),
    pointsValidityYears: z.string().trim(),
  });
};

export type UpdatePointSettingForm = z.infer<
  ReturnType<typeof useUpdatePointSettingFormSchema>
>;
