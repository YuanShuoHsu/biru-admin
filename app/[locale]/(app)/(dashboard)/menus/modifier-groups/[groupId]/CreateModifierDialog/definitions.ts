import { useTranslations } from "next-intl";
import * as z from "zod";

import { itemAvailabilityValues, orderModeValues } from "@/types/api";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useCreateModifierFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    displayName: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    priceAdjustment: z.string().trim().optional(),
    availability: z.enum(itemAvailabilityValues),
    availableModes: z
      .array(z.enum(orderModeValues))
      .min(1, { error: tValidation("availableModes.notSelected") }),
  });
};

export type CreateModifierForm = z.infer<
  ReturnType<typeof useCreateModifierFormSchema>
>;
