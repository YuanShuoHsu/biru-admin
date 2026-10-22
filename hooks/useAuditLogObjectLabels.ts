import { useTranslations } from "next-intl";
import { useMemo } from "react";

const QUANTITATIVE_KEYS = ["unitText", "value"] as const;

const CUSTOMER_KEYS = ["email", "name", "remark", "telephone"] as const;

const WAITLIST_GROUP_KEYS = ["prefix", "minPartySize", "maxPartySize"] as const;

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

const DATE_PERIOD_FIELDS = [
  "childcareReductionPeriods",
  "nursingPeriods",
  "pregnancyPeriods",
  "studentVacations",
  "workPermits",
] as const;

export const useAuditLogObjectLabels = () => {
  const tAttendance = useTranslations("attendance");
  const tAudit = useTranslations("audit");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");
  const tOrganizations = useTranslations("organizations");

  return useMemo<Record<string, Record<string, string>>>(
    () => ({
      ...Object.fromEntries(
        DATE_PERIOD_FIELDS.map((field) => [
          field,
          {
            from: tAttendance(`${field}.from`),
            to: tAttendance(`${field}.to`),
          },
        ]),
      ),
      breaks: {
        endsAt: tAttendance("endsAt"),
        startsAt: tAttendance("startsAt"),
      },
      customer: Object.fromEntries(
        CUSTOMER_KEYS.map((key) => [
          key,
          tOrder(`checkout.customer.${key}.label`),
        ]),
      ),
      groups: Object.fromEntries(
        WAITLIST_GROUP_KEYS.map((key) => [
          key,
          tOrganizations(`waitlist.groups.${key}.label`),
        ]),
      ),
      inventoryLevel: Object.fromEntries(
        QUANTITATIVE_KEYS.map((key) => [
          key,
          tMenus(`items.offers.inventoryLevel.${key}.label`),
        ]),
      ),
      items: {
        amount: tAudit("field.amount"),
        menuItemName: tAudit("field.menuItem"),
        orderItemId: tAudit("refundItem.orderItemId"),
        quantity: tAudit("refundItem.quantity"),
        unitPrice: tAudit("refundItem.unitPrice"),
      },
      nutrition: Object.fromEntries(
        NUTRITION_KEYS.map((key) => [key, tAudit(`nutrition.${key}`)]),
      ),
      priceSpecification: {
        price: tMenus("items.offers.priceSpecification.price.label"),
        validFrom: tMenus("items.offers.priceSpecification.validFrom.label"),
        validThrough: tMenus(
          "items.offers.priceSpecification.validThrough.label",
        ),
      },
      weeklyMinutesHistory: {
        from: tAudit("field.effectiveDate"),
        minutes: tAudit("field.weeklyMinutes"),
      },
    }),
    [tAttendance, tAudit, tMenus, tOrder, tOrganizations],
  );
};
