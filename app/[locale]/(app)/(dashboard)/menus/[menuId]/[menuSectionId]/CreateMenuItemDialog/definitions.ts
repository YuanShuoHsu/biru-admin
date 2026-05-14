import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateMenuItemFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    description: z.string().trim().optional(),
  });
};

export type CreateMenuItemForm = z.infer<
  ReturnType<typeof useCreateMenuItemFormSchema>
>;
