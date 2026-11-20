import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdatePointSettingFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    accountingValuePerPoint: z.string().trim(),
    amountPerPoint: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || Number(value) > 0,
        tValidation("number.positive"),
      ),
  });
};

export type UpdatePointSettingForm = z.infer<
  ReturnType<typeof useUpdatePointSettingFormSchema>
>;
