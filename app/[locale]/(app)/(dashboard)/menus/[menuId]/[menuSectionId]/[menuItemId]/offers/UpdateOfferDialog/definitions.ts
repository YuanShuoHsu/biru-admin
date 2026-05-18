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
    inventoryLevel: quantitativeValueSchema.optional(),
    deliveryLeadTime: quantitativeValueSchema.optional(),
    priceSpecification: z
      .object({
        price: z.string().trim().optional(),
        validFrom: z.string().trim().optional(),
        validThrough: z.string().trim().optional(),
      })
      .optional(),
  });
};

export type UpdateOfferForm = z.infer<
  ReturnType<typeof useUpdateOfferFormSchema>
>;
