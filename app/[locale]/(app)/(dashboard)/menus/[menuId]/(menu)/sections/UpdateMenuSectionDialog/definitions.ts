import { useTranslations } from "next-intl";
import * as z from "zod";

import { hasAllLocalizedText } from "@/utils/locale";

export const useUpdateMenuSectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .record(
        z.string(),
        z.string().trim().min(1, { error: tValidation("name.minLength") }),
      )
      .refine(hasAllLocalizedText, {
        message: tValidation("localizedText.required"),
        path: ["root"],
      }),
    description: z
      .record(
        z.string(),
        z.string().trim().max(160, {
          error: tValidation("description.maxLength"),
        }),
      )
      .optional(),
  });
};

export type UpdateMenuSectionForm = z.infer<
  ReturnType<typeof useUpdateMenuSectionFormSchema>
>;
