import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateModifierFormSchema = () => {
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

export type UpdateModifierForm = z.infer<
  ReturnType<typeof useUpdateModifierFormSchema>
>;
