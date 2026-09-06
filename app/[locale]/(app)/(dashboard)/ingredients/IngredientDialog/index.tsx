"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  useIngredientFormSchema,
  type IngredientFormInput,
  type IngredientFormOutput,
} from "./definitions";

import CountryAutocomplete from "@/components/CountryAutocomplete";
import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { BASE_UNIT_CODES, UNIT_FACTORS } from "@/constants/inventory";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { Grid, MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { unitCodeValues } from "@/types/api";
import type { Ingredient, Supplier } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import {
  formatUnitPriceOf,
  maxPackages,
  toBaseQuantity,
  toPackages,
} from "@/utils/ingredients";
import { localize } from "@/utils/locale";

const INGREDIENT_IMAGE_KEY = "ingredient-image";

interface IngredientDialogProps {
  ingredient: Ingredient | null;
  mutate: () => void;
  organizationSlug: string;
  suppliers: Supplier[];
}

const IngredientDialog = ({
  ingredient,
  mutate,
  organizationSlug,
  suppliers,
}: IngredientDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const imageSrc = useUploadAvatarSrc(
    INGREDIENT_IMAGE_KEY,
    ingredient?.image || null,
  );

  const ingredientFormSchema = useIngredientFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<IngredientFormInput, unknown, IngredientFormOutput>({
    defaultValues: {
      brand: ingredient?.brand || "",
      eligibleQuantity: ingredient?.eligibleQuantity || "",
      inventoryLevel: "",
      lowStockThreshold:
        ingredient?.lowStockThreshold && ingredient.packageBaseQuantity
          ? String(
              toPackages(
                Number(ingredient.lowStockThreshold),
                Number(ingredient.packageBaseQuantity),
              ),
            )
          : "",
      price: ingredient?.price || "",
      priceCurrency: ingredient?.priceCurrency || "TWD",
      url: ingredient?.url || "",
      name: ingredient?.name || {},
      supplierId: ingredient?.supplierId || "",
      unitCode:
        ingredient?.eligibleQuantityUnitCode || ingredient?.unitCode || "",
    },
    resolver: zodResolver(ingredientFormSchema),
  });

  const eligibleQuantity = useWatch({ control, name: "eligibleQuantity" });
  const inventoryLevel = useWatch({ control, name: "inventoryLevel" });
  const lowStockThreshold = useWatch({ control, name: "lowStockThreshold" });
  const price = useWatch({ control, name: "price" });
  const priceCurrency = useWatch({ control, name: "priceCurrency" });
  const name = useWatch({ control, name: "name" });
  const supplierId = useWatch({ control, name: "supplierId" });
  const unitCode = useWatch({ control, name: "unitCode" });

  const packageUnitCode =
    unitCodeValues.find((unit) => unit === unitCode) ?? null;
  const baseUnitCode = packageUnitCode && BASE_UNIT_CODES[packageUnitCode];
  const baseQuantity =
    Number(eligibleQuantity) *
    (packageUnitCode ? UNIT_FACTORS[packageUnitCode] : 0);
  const unitCostHint =
    baseQuantity > 0 && Number(price) > 0 && baseUnitCode
      ? formatUnitPriceOf(
          Number(price) / baseQuantity,
          { priceCurrency, unitCode: baseUnitCode },
          { format, tCommon, tInventory },
        )
      : "";

  const packageHint = (packages?: string) =>
    baseQuantity && baseUnitCode
      ? Number(packages)
        ? `${format.number(toBaseQuantity(Number(packages), baseQuantity))} ${tInventory(`units.${baseUnitCode}`)}`
        : ""
      : tInventory("ingredients.packageRequired");

  const stockOnHand =
    ingredient && baseQuantity > 0
      ? toPackages(Number(ingredient.inventoryLevel), baseQuantity)
      : null;

  const action = ingredient ? "updateIngredient" : "createIngredient";

  const onSubmitHandler = async (values: IngredientFormOutput) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Ingredient>(
        ingredient
          ? `/api/ingredients/${ingredient.id}`
          : `/api/organizations/${organizationSlug}/ingredients`,
        {
          method: ingredient ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            brand: values.brand || null,
            image: imageSrc || null,
            eligibleQuantity: values.eligibleQuantity,
            eligibleQuantityUnitCode: values.unitCode,
            unitCode: BASE_UNIT_CODES[values.unitCode],
            lowStockThreshold:
              values.lowStockThreshold && baseQuantity > 0
                ? String(
                    toBaseQuantity(
                      Number(values.lowStockThreshold),
                      baseQuantity,
                    ),
                  )
                : null,
            ...(!ingredient && {
              inventoryLevel:
                values.inventoryLevel && baseQuantity > 0
                  ? String(
                      toBaseQuantity(
                        Number(values.inventoryLevel),
                        baseQuantity,
                      ),
                    )
                  : null,
            }),
            price: values.price,
            priceCurrency: values.priceCurrency,
            supplierId: values.supplierId || null,
            url: values.url || null,
          }),
        },
      );

      enqueueSnackbar(
        tInventory(`ingredients.actions.${action}.success`, {
          name: localize(values.name, locale),
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tInventory(`ingredients.actions.${action}.error`), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="ingredient-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={ingredient?.image || null}
        shape="square"
        uploadKey={INGREDIENT_IMAGE_KEY}
      />
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.name?.[lang],
            fullWidth: true,
            helperText: errors.name?.[lang]?.message,
            label: tInventory("ingredients.name.label"),
            onChange: (event) =>
              setValue("name", { ...name, [lang]: event.target.value }),
            placeholder: tInventory("ingredients.name.placeholder"),
            required: true,
            value: name?.[lang] || "",
          },
        ]}
      />
      <TextField
        error={!!errors.brand}
        fullWidth
        helperText={errors.brand?.message}
        label={`${tInventory("ingredients.brand.label")} ${tCommon("optional")}`}
        placeholder={tInventory("ingredients.brand.placeholder")}
        {...register("brand")}
      />
      <Grid container width="100%" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CountryAutocomplete
            error={!!errors.priceCurrency}
            helperText={errors.priceCurrency?.message}
            label={tInventory("ingredients.priceCurrency.label")}
            mode="currency"
            placeholder={tInventory("ingredients.priceCurrency.placeholder")}
            required
            value={priceCurrency || ""}
            {...register("priceCurrency")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={2}
            error={!!errors.price}
            fullWidth
            helperText={errors.price?.message || unitCostHint}
            isAllowed={({ floatValue }) =>
              floatValue === undefined || floatValue <= 99999999.99
            }
            label={tInventory("ingredients.price.label")}
            onValueChange={({ value }) =>
              setValue("price", value, { shouldValidate: isSubmitted })
            }
            placeholder={tInventory("ingredients.price.placeholder")}
            required
            thousandSeparator=","
            value={price}
            valueIsNumericString
          />
        </Grid>
      </Grid>
      <Grid container width="100%" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={3}
            error={!!errors.eligibleQuantity}
            fullWidth
            helperText={errors.eligibleQuantity?.message}
            isAllowed={({ floatValue }) =>
              floatValue === undefined || floatValue <= 999999999.999
            }
            label={tInventory("ingredients.eligibleQuantity.label")}
            onValueChange={({ value }) =>
              setValue("eligibleQuantity", value, {
                shouldValidate: isSubmitted,
              })
            }
            placeholder={tInventory("ingredients.eligibleQuantity.placeholder")}
            required
            thousandSeparator=","
            value={eligibleQuantity}
            valueIsNumericString
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.unitCode}
            fullWidth
            helperText={errors.unitCode?.message}
            label={tInventory("ingredients.eligibleQuantityUnitCode.label")}
            required
            select
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (selected) => {
                  const value = unitCodeValues.find(
                    (unit) => unit === selected,
                  );

                  return value ? (
                    tInventory(`units.${value}`)
                  ) : (
                    <em>
                      {tInventory(
                        "ingredients.eligibleQuantityUnitCode.placeholder",
                      )}
                    </em>
                  );
                },
              },
            }}
            value={unitCode}
            {...register("unitCode")}
          >
            <MenuItem disabled value="">
              <em>
                {tInventory("ingredients.eligibleQuantityUnitCode.placeholder")}
              </em>
            </MenuItem>
            {unitCodeValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tInventory(`units.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      {ingredient ? (
        <NumberSpinner
          disabled
          format={{ maximumFractionDigits: 3 }}
          fullWidth
          helperText={tInventory("ingredients.inventoryLevel.readOnly")}
          label={tInventory("ingredients.inventoryLevel.label")}
          value={stockOnHand}
        />
      ) : (
        <NumberSpinner
          clearable
          disabled={!baseQuantity}
          error={!!errors.inventoryLevel}
          format={{ maximumFractionDigits: 3 }}
          fullWidth
          helperText={
            errors.inventoryLevel?.message || packageHint(inventoryLevel)
          }
          label={`${tInventory("ingredients.inventoryLevel.label")} ${tCommon("optional")}`}
          max={maxPackages(baseQuantity)}
          min={0}
          onValueChange={(value) =>
            setValue("inventoryLevel", value != null ? String(value) : "", {
              shouldValidate: isSubmitted,
            })
          }
          placeholder={tInventory("ingredients.inventoryLevel.placeholder")}
          value={inventoryLevel ? Number(inventoryLevel) : null}
        />
      )}
      <NumberSpinner
        clearable
        disabled={!baseQuantity}
        error={!!errors.lowStockThreshold}
        format={{ maximumFractionDigits: 0 }}
        fullWidth
        helperText={
          errors.lowStockThreshold?.message || packageHint(lowStockThreshold)
        }
        label={`${tInventory("ingredients.lowStockThreshold.label")} ${tCommon("optional")}`}
        max={maxPackages(baseQuantity)}
        min={0}
        onValueChange={(value) =>
          setValue("lowStockThreshold", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("ingredients.lowStockThreshold.placeholder")}
        smallStep={1}
        value={lowStockThreshold ? Number(lowStockThreshold) : null}
      />
      <TextField
        error={!!errors.supplierId}
        fullWidth
        helperText={errors.supplierId?.message}
        label={`${tInventory("ingredients.supplierId.label")} ${tCommon("optional")}`}
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const supplier = suppliers.find(({ id }) => id === selected);

              return supplier ? (
                supplier.name
              ) : (
                <em>{tInventory("ingredients.supplierId.placeholder")}</em>
              );
            },
          },
        }}
        value={supplierId}
        {...register("supplierId")}
      >
        <MenuItem value="">
          <em>{tInventory("ingredients.supplierId.placeholder")}</em>
        </MenuItem>
        {suppliers.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.url}
        fullWidth
        helperText={errors.url?.message}
        label={`${tInventory("ingredients.url.label")} ${tCommon("optional")}`}
        placeholder={tInventory("ingredients.url.placeholder")}
        {...register("url")}
      />
    </FormBox>
  );
};

export default IngredientDialog;
