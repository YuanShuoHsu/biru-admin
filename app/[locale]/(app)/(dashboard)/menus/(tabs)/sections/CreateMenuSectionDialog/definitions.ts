import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  refineRequiredLocalizedText,
  refineOptionalLocalizedText,
} from "@/utils/locale";

export const useCreateMenuSectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    description: z
      .record(
        z.string(),
        z
          .string()
          .trim()
          .max(160, {
            error: tValidation("description.maxLength"),
          }),
      )
      .optional()
      .superRefine(
        refineOptionalLocalizedText(
          tValidation("localizedText.completeOrEmpty"),
        ),
      ),
  });
};

export type CreateMenuSectionForm = z.infer<
  ReturnType<typeof useCreateMenuSectionFormSchema>
>;
