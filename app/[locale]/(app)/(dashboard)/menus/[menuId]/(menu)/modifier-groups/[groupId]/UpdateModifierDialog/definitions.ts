import { useTranslations } from "next-intl";
import * as z from "zod";

import { hasAllLocalizedText } from "@/utils/locale";

export const useUpdateModifierFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .record(
        z.string(),
        z
          .string()
          .trim()
          .min(1, { error: tValidation("name.minLength") }),
      )
      .refine(hasAllLocalizedText, {
        message: tValidation("localizedText.required"),
        path: ["root"],
      }),
    priceAdjustment: z.string().trim().optional(),
    availability: z.string().trim().optional(),
  });
};

export type UpdateModifierForm = z.infer<
  ReturnType<typeof useUpdateModifierFormSchema>
>;
