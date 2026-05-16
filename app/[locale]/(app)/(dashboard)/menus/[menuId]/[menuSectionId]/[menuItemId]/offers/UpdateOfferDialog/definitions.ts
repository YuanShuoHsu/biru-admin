// https://schema.org/ItemAvailability

import { useTranslations } from "next-intl";
import * as z from "zod";

export const ITEM_AVAILABILITY_VALUES = [
  "BackOrder",
  "Discontinued",
  "InStock",
  "InStoreOnly",
  "LimitedAvailability",
  "MadeToOrder",
  "OnlineOnly",
  "OutOfStock",
  "PreOrder",
  "PreSale",
  "Reserved",
  "SoldOut",
] as const;

export const useUpdateOfferFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z.string().trim().optional(),
    priceCurrency: z.string().trim().min(1),
    price: z
      .string()
      .trim()
      .min(1, { error: tValidation("name.minLength") }),
    availability: z.enum(ITEM_AVAILABILITY_VALUES),
    sku: z.string().trim().optional(),
    eligibleQuantity: z
      .object({
        maxValue: z.string().optional(),
        minValue: z.string().optional(),
        unitCode: z.string().trim().optional(),
        unitText: z.string().trim().optional(),
      })
      .optional(),
    validFrom: z.string().trim().optional(),
    validThrough: z.string().trim().optional(),
  });
};

export type UpdateOfferForm = z.infer<
  ReturnType<typeof useUpdateOfferFormSchema>
>;
