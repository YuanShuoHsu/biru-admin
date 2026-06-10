import { useTranslations } from "next-intl";
import * as z from "zod";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useCreateModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      displayName: z
        .record(z.string(), z.string().trim())
        .superRefine(
          refineRequiredLocalizedText(tValidation("localizedText.required")),
        ),
      minSelectionCount: z.string().trim().optional(),
      maxSelectionCount: z.string().trim().optional(),
    })
    .superRefine(({ minSelectionCount, maxSelectionCount }, ctx) => {
      if (
        minSelectionCount &&
        maxSelectionCount &&
        Number(maxSelectionCount) < Number(minSelectionCount)
      ) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("maxSelectionCount.lessThanMin"),
          path: ["maxSelectionCount"],
        });
      }
    });
};

export type CreateModifierGroupForm = z.infer<
  ReturnType<typeof useCreateModifierGroupFormSchema>
>;
