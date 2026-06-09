import { useTranslations } from "next-intl";
import * as z from "zod";

import { itemAvailabilityValues } from "@/types/api";

import { hasAllLocalizedText } from "@/utils/locale";

const quantitativeValueSchema = z.object({
  unitText: z.string().trim().optional(),
  value: z.string().optional(),
});

export const useCreateMenuItemFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .record(
        z.string(),
        z
          .string()
          .trim()
          .min(1, { error: tValidation("name.minLength") }),
      )
      .refine(hasAllLocalizedText, {
        message: tValidation("localizedText.required"),
        path: ["root"],
      }),
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
      .optional(),
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

export type CreateMenuItemForm = z.infer<
  ReturnType<typeof useCreateMenuItemFormSchema>
>;
