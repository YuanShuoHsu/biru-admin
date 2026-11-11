import { useTranslations } from "next-intl";
import * as z from "zod";

import { MODIFIER_GROUP_MAX_SELECTION_COUNT } from "@/constants/menus";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useCreateModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    minSelectionCount: z
      .string()
      .trim()
      .refine((value) => !value || Number.isInteger(Number(value)), {
        error: tValidation("number.integer"),
      })
      .refine(
        (value) =>
          !value || Number(value) <= MODIFIER_GROUP_MAX_SELECTION_COUNT,
        {
          error: tValidation("number.max", {
            max: MODIFIER_GROUP_MAX_SELECTION_COUNT,
          }),
        },
      )
      .optional(),
    maxSelectionCount: z
      .string()
      .trim()
      .refine((value) => !value || Number.isInteger(Number(value)), {
        error: tValidation("number.integer"),
      })
      .refine(
        (value) =>
          !value || Number(value) <= MODIFIER_GROUP_MAX_SELECTION_COUNT,
        {
          error: tValidation("number.max", {
            max: MODIFIER_GROUP_MAX_SELECTION_COUNT,
          }),
        },
      )
      .optional(),
  });
};

export type CreateModifierGroupForm = z.infer<
  ReturnType<typeof useCreateModifierGroupFormSchema>
>;
