import { useTranslations } from "next-intl";
import * as z from "zod";

import { hasAllLocalizedText } from "@/utils/locale";

export const useUpdateModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .record(
        z.string(),
        z.string().trim().min(1, { error: tValidation("name.minLength") }),
      )
      .refine(hasAllLocalizedText, {
        message: tValidation("localizedText.required"),
        path: ["root"],
      }),
    minSelectionCount: z.string().trim().optional(),
    maxSelectionCount: z.string().trim().optional(),
  });
};

export type UpdateModifierGroupForm = z.infer<
  ReturnType<typeof useUpdateModifierGroupFormSchema>
>;
