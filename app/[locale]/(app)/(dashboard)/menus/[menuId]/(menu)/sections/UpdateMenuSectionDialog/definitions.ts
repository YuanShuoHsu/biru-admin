import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateMenuSectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    description: z
      .string()
      .trim()
      .max(160, { error: tValidation("description.maxLength") })
      .optional(),
  });
};

export type UpdateMenuSectionForm = z.infer<
  ReturnType<typeof useUpdateMenuSectionFormSchema>
>;
