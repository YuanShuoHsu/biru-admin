import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateOrganizationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(2, { error: tValidation("name.minLength") })
      .trim(),
    slug: z
      .string()
      .min(1, { error: tValidation("slug.minLength") })
      .regex(/[a-zA-Z]/, { error: tValidation("slug.letter") })
      .trim(),
  });
};

export type UpdateOrganizationForm = z.infer<
  ReturnType<typeof useUpdateOrganizationFormSchema>
>;
