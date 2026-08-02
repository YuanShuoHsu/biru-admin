import { useTranslations } from "next-intl";
import * as z from "zod";

import { itemAvailabilityValues, orderModeValues } from "@/types/api";

import {
  refineRequiredLocalizedText,
  refineOptionalLocalizedText,
} from "@/utils/locale";

const quantitativeValueSchema = z.object({
  unitText: z.string().trim().optional(),
  value: z.string().optional(),
});

export const useUpdateMenuItemFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .record(z.string(), z.string().trim())
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    description: z
      .record(
        z.string(),
        z
          .string()
          .trim()
          .max(160, {
            error: tValidation("description.maxLength"),
          }),
      )
      .optional()
      .superRefine(
        refineOptionalLocalizedText(
          tValidation("localizedText.completeOrEmpty"),
        ),
      ),
    availableModes: z
      .array(z.enum(orderModeValues))
      .min(1, { error: tValidation("availableModes.notSelected") }),
    offer: z
      .object({
        priceCurrency: z.string().trim().min(1),
        price: z
          .string()
          .trim()
          .min(1, { error: tValidation("price.required") }),
        availability: z.enum(itemAvailabilityValues),
        inventoryLevel: quantitativeValueSchema.optional(),
        deliveryLeadTime: quantitativeValueSchema.optional(),
        priceSpecification: z
          .object({
            price: z.string().trim().optional(),
            validFrom: z.string().trim().optional(),
            validThrough: z.string().trim().optional(),
          })
          .refine(
            ({ validFrom, validThrough }) => {
              if (!validFrom || !validThrough) return true;
              return new Date(validFrom) < new Date(validThrough);
            },
            {
              message: tValidation("validFrom.beforeValidThrough"),
              path: ["validThrough"],
            },
          )
          .optional(),
      })
      .optional(),
  });
};

export type UpdateMenuItemForm = z.infer<
  ReturnType<typeof useUpdateMenuItemFormSchema>
>;
