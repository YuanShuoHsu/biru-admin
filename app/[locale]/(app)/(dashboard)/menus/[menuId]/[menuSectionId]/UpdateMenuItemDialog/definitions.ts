import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateMenuItemFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    description: z.string().trim().optional(),
    image: z.string().trim().optional(),
    url: z.string().trim().optional(),
  });
};

export type UpdateMenuItemForm = z.infer<
  ReturnType<typeof useUpdateMenuItemFormSchema>
>;
