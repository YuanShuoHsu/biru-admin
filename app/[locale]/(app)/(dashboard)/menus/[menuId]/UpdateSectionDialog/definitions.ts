import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateSectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    description: z.string().trim().optional(),
  });
};

export type UpdateSectionForm = z.infer<
  ReturnType<typeof useUpdateSectionFormSchema>
>;
