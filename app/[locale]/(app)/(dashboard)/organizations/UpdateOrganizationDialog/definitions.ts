import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateOrganizationFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("name.required") }),
    slug: z
      .string()
      .trim()
      .min(1, { error: tValidation("slug.required") })
      .regex(/[a-zA-Z]/, { error: tValidation("slug.letter") }),
  });
};

export type UpdateOrganizationForm = z.infer<
  ReturnType<typeof useUpdateOrganizationFormSchema>
>;
