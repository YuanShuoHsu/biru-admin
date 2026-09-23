import { useTranslations } from "next-intl";
import * as z from "zod";

import { servingTemperatureValues } from "@/types/api";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useCreateModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    minSelectionCount: z.string().trim().optional(),
    maxSelectionCount: z.string().trim().optional(),
    servingTemperature: z.enum(servingTemperatureValues).or(z.literal("")),
  });
};

export type CreateModifierGroupForm = z.infer<
  ReturnType<typeof useCreateModifierGroupFormSchema>
>;
