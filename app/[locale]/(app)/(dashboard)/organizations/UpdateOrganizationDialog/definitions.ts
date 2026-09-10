import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateOrganizationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(1, { error: tValidation("name.required") })
      .trim(),
    slug: z
      .string()
      .min(1, { error: tValidation("slug.required") })
      .regex(/[a-zA-Z]/, { error: tValidation("slug.letter") })
      .trim(),
  });
};

export type UpdateOrganizationForm = z.infer<
  ReturnType<typeof useUpdateOrganizationFormSchema>
>;
