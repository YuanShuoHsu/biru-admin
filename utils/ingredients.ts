import type { useFormatter, useTranslations } from "next-intl";

import type { useFormatMoney } from "@/hooks/useFormatMoney";

import type { Ingredient } from "@/types/inventory";

interface IngredientFormatters {
  format: ReturnType<typeof useFormatter>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
  tInventory: ReturnType<typeof useTranslations<"inventory">>;
}

interface IngredientPriceFormatters extends IngredientFormatters {
  formatMoney: ReturnType<typeof useFormatMoney>;
}

const showsPackages = (packageBaseQuantity: number) => {
  const packageMilli = Math.round(packageBaseQuantity * 1000);

  return packageMilli > 0 && packageMilli !== 1000;
};

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
    showPackages: showsPackages(packageBaseQuantity),
  };
};

export const toPackages = (baseQuantity: number, packageBaseQuantity: number) =>
  Math.round((baseQuantity / packageBaseQuantity) * 1000) / 1000;

export const toBaseQuantity = (packages: number, packageBaseQuantity: number) =>
  Math.round(packages * packageBaseQuantity * 1000) / 1000;

export const maxPackages = (packageBaseQuantity: number | null | undefined) =>
  packageBaseQuantity
    ? Math.floor(999999999.999 / packageBaseQuantity)
    : undefined;

const withSuffix = (
  value: string,
  suffix: string[],
  tCommon: IngredientFormatters["tCommon"],
) =>
  suffix.length
    ? `${value}${tCommon("parenthesisOpen")}${suffix.join(tCommon("delimiter"))}${tCommon("parenthesisClose")}`
    : value;

export const stockParts = (
  quantity: number,
  ingredient: Ingredient,
  { format, tCommon, tInventory }: IngredientFormatters,
) => {
  const { inventoryLevelUnitText, packageBaseQuantity, unitCode } = ingredient;
  const { packages, remainder, showPackages } = packagesOf(
    quantity,
    Number(packageBaseQuantity),
  );
  const formatPackages = (count: number) =>
    inventoryLevelUnitText
      ? `${format.number(count)} ${inventoryLevelUnitText}`
      : `${tCommon("multiply")}${format.number(count)}`;

  return {
    hasSuffix: showPackages,
    suffix: withSuffix(
      "",
      showPackages
        ? [
            formatPackages(packages),
            ...(remainder
              ? [
                  `${format.number(remainder, { maximumFractionDigits: 3 })} ${tInventory(`units.${unitCode}`)}`,
                ]
              : []),
          ]
        : [formatPackages(0)],
      tCommon,
    ),
    value: `${format.number(quantity)} ${tInventory(`units.${unitCode}`)}`,
  };
};

export const formatStock = (
  quantity: number,
  ingredient: Ingredient,
  formatters: IngredientFormatters,
) => {
  const { hasSuffix, suffix, value } = stockParts(
    quantity,
    ingredient,
    formatters,
  );

  return hasSuffix ? `${value}${suffix}` : value;
};

export const formatStockDelta = (
  quantity: number,
  { packageBaseQuantity, unitCode }: Ingredient,
  { format, tCommon, tInventory }: IngredientFormatters,
) =>
  withSuffix(
    `${format.number(quantity, { signDisplay: "exceptZero" })} ${tInventory(`units.${unitCode}`)}`,
    showsPackages(Number(packageBaseQuantity))
      ? [
          format.number(toPackages(quantity, Number(packageBaseQuantity)), {
            maximumFractionDigits: 3,
            signDisplay: "exceptZero",
          }),
        ]
      : [],
    tCommon,
  );

export const formatPackageQuantity = (
  { eligibleQuantity, eligibleQuantityUnitCode }: Ingredient,
  { format, tInventory }: IngredientFormatters,
) =>
  eligibleQuantity && eligibleQuantityUnitCode
    ? `${format.number(Number(eligibleQuantity))} ${tInventory(`units.${eligibleQuantityUnitCode}`)}`
    : "";

export const formatPackagePrice = (
  { price, priceCurrency }: Ingredient,
  { formatMoney }: IngredientPriceFormatters,
) => (price == null ? "" : formatMoney(Number(price), priceCurrency));

export const formatPackage = (
  ingredient: Ingredient,
  formatters: IngredientPriceFormatters,
) => {
  const quantity = formatPackageQuantity(ingredient, formatters);
  const price = formatPackagePrice(ingredient, formatters);

  return quantity
    ? withSuffix(quantity, price ? [price] : [], formatters.tCommon)
    : "";
};

export const formatUnitPriceOf = (
  value: number,
  { priceCurrency, unitCode }: Pick<Ingredient, "priceCurrency" | "unitCode">,
  { formatMoney, tCommon, tInventory }: IngredientPriceFormatters,
) =>
  `${formatMoney(value, priceCurrency, { maximumFractionDigits: 6 })}${tCommon("slash")}${tInventory(`units.${unitCode}`)}`;

export const formatUnitPrice = (
  ingredient: Ingredient,
  formatters: IngredientPriceFormatters,
) =>
  ingredient.unitPrice == null
    ? ""
    : formatUnitPriceOf(ingredient.unitPrice, ingredient, formatters);
