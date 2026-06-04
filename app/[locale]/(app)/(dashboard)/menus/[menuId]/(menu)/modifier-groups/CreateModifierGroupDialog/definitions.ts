import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    minSelectionCount: z.string().trim().optional(),
    maxSelectionCount: z.string().trim().optional(),
  });
};

export type CreateModifierGroupForm = z.infer<
  ReturnType<typeof useCreateModifierGroupFormSchema>
>;
