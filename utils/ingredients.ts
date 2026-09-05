import type { useFormatter, useTranslations } from "next-intl";

import type { Ingredient } from "@/types/inventory";

interface IngredientFormatters {
  format: ReturnType<typeof useFormatter>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
  tInventory: ReturnType<typeof useTranslations<"inventory">>;
}

export const packagesOf = (quantity: number, packageBaseQuantity: number) => {
  const quantityMilli = Math.round(quantity * 1000);
  const packageMilli = Math.round(packageBaseQuantity * 1000);
  const packages =
    packageMilli > 0 && quantityMilli > 0
      ? Math.floor(quantityMilli / packageMilli)
      : 0;

  return {
    packages,
    remainder:
      packages > 0 ? (quantityMilli - packages * packageMilli) / 1000 : 0,
    showPackages: packageMilli > 0 && packageMilli !== 1000,
  };
};

export const toPackages = (baseQuantity: number, packageBaseQuantity: number) =>
  Math.round((baseQuantity / packageBaseQuantity) * 1000) / 1000;

export const toBaseQuantity = (packages: number, packageBaseQuantity: number) =>
  Math.round(packages * packageBaseQuantity * 1000) / 1000;

export const labelWithPackageUnit = (
  label: string,
  tCommon: IngredientFormatters["tCommon"],
  tInventory: IngredientFormatters["tInventory"],
) =>
  `${label}${tCommon("parenthesisOpen")}${tInventory("ingredients.packageUnit")}${tCommon("parenthesisClose")}`;

// 三個 formatter 一律是「主要數值（補充說明）」，庫存、包裝、單位成本才對得起來
const withSuffix = (
  value: string,
  suffix: string[],
  tCommon: IngredientFormatters["tCommon"],
) =>
  suffix.length
    ? `${value}${tCommon("parenthesisOpen")}${suffix.join(tCommon("delimiter"))}${tCommon("parenthesisClose")}`
    : value;

export const formatStock = (
  quantity: number,
  ingredient: Ingredient,
  { format, tCommon, tInventory }: IngredientFormatters,
) => {
  const { packageBaseQuantity, unitCode } = ingredient;
  const { packages, remainder, showPackages } = packagesOf(
    quantity,
    Number(packageBaseQuantity),
  );

  return withSuffix(
    `${format.number(quantity)} ${tInventory(`units.${unitCode}`)}`,
    showPackages
      ? [
          `${format.number(packages)} ${tInventory("ingredients.packageUnit")}`,
          ...(remainder
            ? [
                `${format.number(remainder, { maximumFractionDigits: 3 })} ${tInventory(`units.${unitCode}`)}`,
              ]
            : []),
        ]
      : [],
    tCommon,
  );
};

export const formatPackageQuantity = (
  { eligibleQuantity, eligibleQuantityUnitCode }: Ingredient,
  { format, tInventory }: IngredientFormatters,
) =>
  eligibleQuantity && eligibleQuantityUnitCode
    ? `${format.number(Number(eligibleQuantity))} ${tInventory(`units.${eligibleQuantityUnitCode}`)}`
    : "";

export const formatPackagePrice = (
  { price, priceCurrency }: Ingredient,
  { format }: IngredientFormatters,
) => (price ? `${priceCurrency} ${format.number(Number(price))}` : "");

export const formatPackage = (
  ingredient: Ingredient,
  formatters: IngredientFormatters,
) => {
  const quantity = formatPackageQuantity(ingredient, formatters);
  const price = formatPackagePrice(ingredient, formatters);

  return quantity
    ? withSuffix(quantity, price ? [price] : [], formatters.tCommon)
    : "";
};

export const formatUnitPrice = (
  { priceCurrency, unitCode, unitPrice }: Ingredient,
  { format, tCommon, tInventory }: IngredientFormatters,
) =>
  unitPrice == null
    ? ""
    : `${priceCurrency} ${format.number(unitPrice, { maximumFractionDigits: 4 })}${tCommon("slash")}${tInventory(`units.${unitCode}`)}`;
