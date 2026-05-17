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

const quantitativeValueSchema = z.object({
  value: z.string().optional(),
  maxValue: z.string().optional(),
  minValue: z.string().optional(),
  unitText: z.string().trim().optional(),
});

export const useUpdateOfferFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    priceCurrency: z.string().trim().min(1),
    price: z
      .string()
      .trim()
      .min(1, { error: tValidation("name.minLength") }),
    availability: z.enum(ITEM_AVAILABILITY_VALUES),
    eligibleQuantity: quantitativeValueSchema.optional(),
    deliveryLeadTime: quantitativeValueSchema.optional(),
    inventoryLevel: quantitativeValueSchema.optional(),
    availabilityStarts: z.string().trim().optional(),
    availabilityEnds: z.string().trim().optional(),
    priceValidUntil: z.string().trim().optional(),
    validFrom: z.string().trim().optional(),
    validThrough: z.string().trim().optional(),
  });
};

export type UpdateOfferForm = z.infer<
  ReturnType<typeof useUpdateOfferFormSchema>
>;
