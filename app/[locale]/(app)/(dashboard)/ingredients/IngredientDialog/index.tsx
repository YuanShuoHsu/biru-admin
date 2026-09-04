"use client";

import { useTranslations } from "next-intl";
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

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { baseUnitCodeValues } from "@/types/api";
import type { Ingredient } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";

const INGREDIENT_IMAGE_KEY = "ingredient-image";

interface IngredientDialogProps {
  ingredient: Ingredient | null;
  mutate: () => void;
  organizationSlug: string;
}

const IngredientDialog = ({
  ingredient,
  mutate,
  organizationSlug,
}: IngredientDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

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
      lowStockThreshold: ingredient?.lowStockThreshold || "",
      name: ingredient?.name || {},
      unitCode: ingredient?.unitCode || "",
    },
    resolver: zodResolver(ingredientFormSchema),
  });

  const lowStockThreshold = useWatch({ control, name: "lowStockThreshold" });
  const name = useWatch({ control, name: "name" });
  const unitCode = useWatch({ control, name: "unitCode" });

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
            ...values,
            brand: values.brand || null,
            image: imageSrc || null,
            lowStockThreshold: values.lowStockThreshold || null,
          }),
        },
      );

      enqueueSnackbar(tInventory(`ingredients.actions.${action}.success`), {
        variant: "success",
      });

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
        initialSrc={ingredient?.image || null}
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
              const value = baseUnitCodeValues.find(
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
        {baseUnitCodeValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tInventory(`units.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        clearable
        error={!!errors.lowStockThreshold}
        fullWidth
        helperText={errors.lowStockThreshold?.message}
        label={`${tInventory("ingredients.lowStockThreshold.label")} ${tCommon("optional")}`}
        min={0}
        onValueChange={(value) =>
          setValue("lowStockThreshold", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("ingredients.lowStockThreshold.placeholder")}
        value={lowStockThreshold ? Number(lowStockThreshold) : null}
      />
    </FormBox>
  );
};

export default IngredientDialog;
