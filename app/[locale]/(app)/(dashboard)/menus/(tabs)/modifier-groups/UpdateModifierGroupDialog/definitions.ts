import { useTranslations } from "next-intl";
import * as z from "zod";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useUpdateModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    minSelectionCount: z.string().trim().optional(),
    maxSelectionCount: z.string().trim().optional(),
  });
};

export type UpdateModifierGroupForm = z.infer<
  ReturnType<typeof useUpdateModifierGroupFormSchema>
>;
