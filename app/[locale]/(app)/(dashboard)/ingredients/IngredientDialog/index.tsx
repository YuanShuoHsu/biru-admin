"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  useIngredientFormSchema,
  type IngredientFormInput,
  type IngredientFormOutput,
} from "./definitions";

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
import type { Ingredient, Supplier, UnitCode } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import {
  labelWithPackageUnit,
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
      // 員工按包清點，警示量也用包數填；資料庫存的是基準單位，載入時換算回來
      lowStockThreshold:
        ingredient?.lowStockThreshold && ingredient.packageBaseQuantity
          ? String(
              toPackages(
                Number(ingredient.lowStockThreshold),
                ingredient.packageBaseQuantity,
              ),
            )
          : "",
      price: ingredient?.price || "",
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
  const name = useWatch({ control, name: "name" });
  const supplierId = useWatch({ control, name: "supplierId" });
  const unitCode = useWatch({ control, name: "unitCode" });

  // 使用者只選一次單位；庫存與食譜用的基準單位由它推導，兩者必然同維度
  const packageUnitCode = unitCode ? (unitCode as UnitCode) : null;
  const baseUnitCode = packageUnitCode && BASE_UNIT_CODES[packageUnitCode];
  const baseQuantity =
    Number(eligibleQuantity) *
    (packageUnitCode ? UNIT_FACTORS[packageUnitCode] : 0);
  // 單位成本是存檔後才算得出來的衍生值，先即時算給使用者看，才知道填對了沒
  const unitCostHint =
    baseQuantity > 0 && Number(price) > 0 && baseUnitCode
      ? `${format.number(Number(price) / baseQuantity, { maximumFractionDigits: 4 })}${tCommon("slash")}${tInventory(`units.${baseUnitCode}`)}`
      : "";

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
            eligibleQuantity: values.eligibleQuantity || null,
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
            price: values.price || null,
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
      <Grid container width="100%" alignItems="flex-end" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.eligibleQuantity}
            fullWidth
            helperText={errors.eligibleQuantity?.message}
            label={`${tInventory("ingredients.eligibleQuantity.label")} ${tCommon("optional")}`}
            min={0}
            onValueChange={(value) =>
              setValue("eligibleQuantity", value != null ? String(value) : "", {
                shouldValidate: isSubmitted,
              })
            }
            placeholder={tInventory("ingredients.eligibleQuantity.placeholder")}
            value={eligibleQuantity ? Number(eligibleQuantity) : null}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.unitCode}
            fullWidth
            helperText={errors.unitCode?.message}
            label={tInventory("ingredients.unitCode.label")}
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
                    <em>{tInventory("ingredients.unitCode.placeholder")}</em>
                  );
                },
              },
            }}
            value={unitCode}
            {...register("unitCode")}
          >
            <MenuItem disabled value="">
              <em>{tInventory("ingredients.unitCode.placeholder")}</em>
            </MenuItem>
            {unitCodeValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tInventory(`units.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <NumberSpinner
        clearable
        error={!!errors.price}
        fullWidth
        helperText={errors.price?.message || unitCostHint}
        label={`${tInventory("ingredients.price.label")} ${tCommon("optional")}`}
        min={0}
        onValueChange={(value) =>
          setValue("price", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("ingredients.price.placeholder")}
        value={price ? Number(price) : null}
      />
      {!ingredient && (
        <NumberSpinner
          clearable
          disabled={!baseQuantity}
          error={!!errors.inventoryLevel}
          fullWidth
          helperText={
            errors.inventoryLevel?.message ||
            (baseQuantity && baseUnitCode
              ? `${format.number(Number(inventoryLevel || 0) * baseQuantity)} ${tInventory(`units.${baseUnitCode}`)}`
              : tInventory("ingredients.packageRequired"))
          }
          label={`${labelWithPackageUnit(
            tInventory("ingredients.inventoryLevel.label"),
            tCommon,
            tInventory,
          )} ${tCommon("optional")}`}
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
        fullWidth
        helperText={
          errors.lowStockThreshold?.message ||
          (baseQuantity && baseUnitCode
            ? `${format.number(Number(lowStockThreshold || 0) * baseQuantity)} ${tInventory(`units.${baseUnitCode}`)}`
            : tInventory("ingredients.packageRequired"))
        }
        label={`${labelWithPackageUnit(
          tInventory("ingredients.lowStockThreshold.label"),
          tCommon,
          tInventory,
        )} ${tCommon("optional")}`}
        min={0}
        onValueChange={(value) =>
          setValue("lowStockThreshold", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("ingredients.lowStockThreshold.placeholder")}
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
