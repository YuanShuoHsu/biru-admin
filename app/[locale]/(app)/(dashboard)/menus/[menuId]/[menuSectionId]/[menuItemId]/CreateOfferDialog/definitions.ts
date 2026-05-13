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

export const useCreateOfferFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    name: z.string().trim().optional(),
    price: z
      .string()
      .trim()
      .min(1, { error: tValidation("name.minLength") }),
    priceCurrency: z.string().trim().min(1),
    availability: z.enum(ITEM_AVAILABILITY_VALUES),
    sku: z.string().trim().optional(),
    eligibleQuantityMin: z.string().optional(),
    eligibleQuantityMax: z.string().optional(),
    validFrom: z.string().trim().optional(),
    validThrough: z.string().trim().optional(),
  });
};

export type CreateOfferForm = z.infer<ReturnType<typeof useCreateOfferFormSchema>>;
