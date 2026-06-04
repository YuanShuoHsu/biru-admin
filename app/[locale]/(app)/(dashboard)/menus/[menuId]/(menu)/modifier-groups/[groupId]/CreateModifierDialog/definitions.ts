import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCreateModifierFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    priceAdjustment: z.string().trim().optional(),
    availability: z.string().trim().optional(),
  });
};

export type CreateModifierForm = z.infer<
  ReturnType<typeof useCreateModifierFormSchema>
>;
