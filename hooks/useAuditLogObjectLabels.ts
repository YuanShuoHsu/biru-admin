import { useTranslations } from "next-intl";
import { useMemo } from "react";

const QUANTITATIVE_KEYS = ["unitText", "value"] as const;

const CUSTOMER_KEYS = ["email", "name", "remark", "telephone"] as const;

const NUTRITION_KEYS = [
  "calories",
  "carbohydrateContent",
  "cholesterolContent",
  "fatContent",
  "fiberContent",
  "proteinContent",
  "saturatedFatContent",
  "servingSize",
  "sodiumContent",
  "sugarContent",
  "transFatContent",
  "unsaturatedFatContent",
] as const;

export const useAuditLogObjectLabels = () => {
  const tAudit = useTranslations("audit");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");

  return useMemo<Record<string, Record<string, string>>>(
    () => ({
      customer: Object.fromEntries(
        CUSTOMER_KEYS.map((key) => [
          key,
          tOrder(`checkout.customer.${key}.label`),
        ]),
      ),
      deliveryLeadTime: Object.fromEntries(
        QUANTITATIVE_KEYS.map((key) => [
          key,
          tMenus(`items.offers.deliveryLeadTime.${key}.label`),
        ]),
      ),
      inventoryLevel: Object.fromEntries(
        QUANTITATIVE_KEYS.map((key) => [
          key,
          tMenus(`items.offers.inventoryLevel.${key}.label`),
        ]),
      ),
      nutrition: Object.fromEntries(
        NUTRITION_KEYS.map((key) => [key, tAudit(`nutrition.${key}`)]),
      ),
      priceSpecification: {
        price: tMenus("items.offers.priceSpecification.price.label"),
        priceCurrency: tAudit("field.priceCurrency"),
        validFrom: tMenus("items.offers.priceSpecification.validFrom.label"),
        validThrough: tMenus(
          "items.offers.priceSpecification.validThrough.label",
        ),
      },
    }),
    [tAudit, tMenus, tOrder],
  );
};
