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

import { useFormatMoney } from "@/hooks/useFormatMoney";
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
  canRecordTransaction: boolean;
  canViewPurchasing: boolean;
  canWrite: boolean;
  ingredient: Ingredient | null;
  mutate: () => void;
  organizationSlug: string;
  suppliers: Supplier[];
}

const IngredientDialog = ({
  canRecordTransaction,
  canViewPurchasing,
  canWrite,
  ingredient,
  mutate,
  organizationSlug,
  suppliers,
}: IngredientDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const formatMoney = useFormatMoney();
  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const imageSrc = useUploadAvatarSrc(
    INGREDIENT_IMAGE_KEY,
    ingredient?.image || null,
  );

  const initialStock =
    ingredient?.packageBaseQuantity && ingredient.inventoryLevel
      ? String(
          toPackages(
            Number(ingredient.inventoryLevel),
            Number(ingredient.packageBaseQuantity),
          ),
        )
      : "";

  const initialLowStockThreshold =
    ingredient?.lowStockThreshold && ingredient.packageBaseQuantity
      ? String(
          toPackages(
            Number(ingredient.lowStockThreshold),
            Number(ingredient.packageBaseQuantity),
          ),
        )
      : "";

  const ingredientFormSchema = useIngredientFormSchema(canViewPurchasing);
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
      inventoryLevel: initialStock,
      inventoryLevelUnitText: ingredient?.inventoryLevelUnitText || "",
      note: ingredient?.note || "",
      transactionNote: "",
      lowStockThreshold: initialLowStockThreshold,
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
          { format, formatMoney, tCommon, tInventory },
        )
      : "";

  // 比照列表：無庫存優先於低庫存，且不受警示量是否設定影響
  const stockNote =
    baseQuantity > 0 && inventoryLevel
      ? Number(inventoryLevel) <= 0
        ? tInventory("ingredients.outOfStock")
        : Number(lowStockThreshold) > 0 &&
            Number(inventoryLevel) <= Number(lowStockThreshold)
          ? tInventory("ingredients.lowStock")
          : null
      : null;

  const packageHint = (packages?: string, delta = 0, extra: string[] = []) => {
    if (!baseQuantity || !baseUnitCode) {
      return tInventory("ingredients.packageRequired");
    }

    const unit = tInventory(`units.${baseUnitCode}`);
    const notes = [
      ...(delta
        ? [
            // 一份等於一個基準單位時份數差與量差會是同一個數字，只印一次
            ...(baseQuantity === 1
              ? []
              : [
                  format.number(toPackages(delta, baseQuantity), {
                    signDisplay: "exceptZero",
                  }),
                ]),
            `${format.number(delta, { signDisplay: "exceptZero" })} ${unit}`,
          ]
        : []),
      ...extra,
    ];

    if (!Number(packages) && !notes.length) {
      return "";
    }

    const amount = `${format.number(toBaseQuantity(Number(packages) || 0, baseQuantity))} ${unit}`;

    return notes.length
      ? `${amount}${tCommon("parenthesisOpen")}${notes.join(tCommon("delimiter"))}${tCommon("parenthesisClose")}`
      : amount;
  };

  const editable = !ingredient || canWrite;
  const stockEditable = !ingredient || canRecordTransaction;

  // 只認使用者親手改過的份數。改包裝內容量會讓同一個份數換算出不同的基準單位量，
  // 拿換算結果比對會把「只改了規格」誤判成盤點
  const toStockPayload = (packages?: string) =>
    packages === initialStock
      ? null
      : packages && baseQuantity > 0
        ? String(toBaseQuantity(Number(packages), baseQuantity))
        : null;

  const stockPayload = toStockPayload(inventoryLevel);
  const stockDelta =
    ingredient && stockPayload != null
      ? Number(stockPayload) - Number(ingredient.inventoryLevel)
      : 0;
  const lowStockThresholdDelta =
    ingredient &&
    lowStockThreshold &&
    baseQuantity > 0 &&
    lowStockThreshold !== initialLowStockThreshold
      ? toBaseQuantity(Number(lowStockThreshold), baseQuantity) -
        Number(ingredient.lowStockThreshold)
      : 0;
  // 新增時開帳量為 0 不會產生帳本，異動備註沒有可掛的交易，填了會被丟掉
  const stockChanged = ingredient
    ? stockPayload != null
    : Number(stockPayload) > 0;

  const action = ingredient
    ? "ingredients.actions.updateIngredient"
    : "ingredients.actions.createIngredient";

  const onSubmitHandler = async (values: IngredientFormOutput) => {
    // 只能盤點的員工改不了規格，直接寫帳本；規格與庫存一起送才需要後端的同一個交易
    if (ingredient && !editable) {
      if (stockPayload == null) {
        closeDialog();

        return;
      }

      await submit(
        `/api/ingredients/${ingredient.id}/inventory-transactions`,
        "POST",
        {
          inventoryLevel: stockPayload,
          note: values.transactionNote || null,
        },
      );

      return;
    }

    await submit(
      ingredient
        ? `/api/ingredients/${ingredient.id}`
        : `/api/organizations/${organizationSlug}/ingredients`,
      ingredient ? "PATCH" : "POST",
      {
        name: values.name,
        brand: values.brand || null,
        image: imageSrc || null,
        eligibleQuantity: values.eligibleQuantity,
        eligibleQuantityUnitCode: values.unitCode,
        unitCode: BASE_UNIT_CODES[values.unitCode],
        lowStockThreshold:
          values.lowStockThreshold && baseQuantity > 0
            ? String(
                toBaseQuantity(Number(values.lowStockThreshold), baseQuantity),
              )
            : null,
        inventoryLevel: stockPayload,
        inventoryLevelUnitText: values.inventoryLevelUnitText || null,
        note: values.note || null,
        ...(stockChanged && {
          transactionNote: values.transactionNote || null,
        }),
        price: values.price,
        priceCurrency: values.priceCurrency,
        supplierId: values.supplierId || null,
        url: values.url || null,
      },
    );
  };

  const submit = async (
    url: string,
    method: string,
    body: Record<string, unknown>,
  ) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Ingredient>(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      enqueueSnackbar(
        tInventory(`${action}.success`, {
          name: localize(name || {}, locale),
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tInventory(`${action}.error`), {
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
        disabled={!editable}
        fullWidth
        initialSrc={ingredient?.image || null}
        shape="square"
        uploadKey={INGREDIENT_IMAGE_KEY}
      />
      <LocalizedTextFields
        fields={(lang) => [
          {
            disabled: !editable,
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
        disabled={!editable}
        error={!!errors.brand}
        fullWidth
        helperText={errors.brand?.message}
        label={`${tInventory("ingredients.brand.label")} ${tCommon("optional")}`}
        placeholder={tInventory("ingredients.brand.placeholder")}
        {...register("brand")}
      />
      {canViewPurchasing && (
        <Grid container width="100%" spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CountryAutocomplete
              disabled={!editable}
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
              disabled={!editable}
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
      )}
      <Grid container width="100%" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={3}
            disabled={!editable}
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
            disabled={!editable}
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
      <Grid container width="100%" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            disabled={!baseQuantity || !stockEditable}
            error={!!errors.inventoryLevel}
            format={{ maximumFractionDigits: 3 }}
            fullWidth
            helperText={
              errors.inventoryLevel?.message ||
              packageHint(
                inventoryLevel,
                stockDelta,
                stockNote ? [stockNote] : [],
              )
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
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            disabled={!editable}
            error={!!errors.inventoryLevelUnitText}
            fullWidth
            helperText={errors.inventoryLevelUnitText?.message}
            label={`${tInventory("ingredients.inventoryLevelUnitText.label")} ${tCommon("optional")}`}
            placeholder={tInventory(
              "ingredients.inventoryLevelUnitText.placeholder",
            )}
            {...register("inventoryLevelUnitText")}
          />
        </Grid>
      </Grid>
      {stockEditable && stockChanged && (
        <TextField
          error={!!errors.transactionNote}
          fullWidth
          helperText={errors.transactionNote?.message}
          label={`${tInventory("ingredients.transactionNote.label")} ${tCommon("optional")}`}
          placeholder={tInventory("ingredients.transactionNote.placeholder")}
          {...register("transactionNote")}
        />
      )}
      <NumberSpinner
        clearable
        disabled={!baseQuantity || !editable}
        error={!!errors.lowStockThreshold}
        format={{ maximumFractionDigits: 0 }}
        fullWidth
        helperText={
          errors.lowStockThreshold?.message ||
          packageHint(lowStockThreshold, lowStockThresholdDelta)
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
      {canViewPurchasing && (
        <>
          <TextField
            disabled={!editable}
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
            disabled={!editable}
            error={!!errors.url}
            fullWidth
            helperText={errors.url?.message}
            label={`${tInventory("ingredients.url.label")} ${tCommon("optional")}`}
            placeholder={tInventory("ingredients.url.placeholder")}
            {...register("url")}
          />
        </>
      )}
      <TextField
        disabled={!editable}
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tInventory("ingredients.note.label")} ${tCommon("optional")}`}
        placeholder={tInventory("ingredients.note.placeholder")}
        {...register("note")}
      />
    </FormBox>
  );
};

export default IngredientDialog;
