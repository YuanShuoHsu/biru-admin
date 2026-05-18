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
  unitText: z.string().trim().optional(),
  value: z.string().optional(),
});

export const useUpdateMenuItemFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    image: z.string().trim().optional(),
    name: z
      .string()
      .min(1, { error: tValidation("name.minLength") })
      .trim(),
    description: z.string().trim().optional(),
    offer: z
      .object({
        priceCurrency: z.string().trim().min(1),
        price: z
          .string()
          .trim()
          .min(1, { error: tValidation("price.required") }),
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
      })
      .optional(),
  });
};

export type UpdateMenuItemForm = z.infer<
  ReturnType<typeof useUpdateMenuItemFormSchema>
>;
