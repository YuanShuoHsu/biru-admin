"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import { useRecipeFormSchema, type RecipeForm } from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { unitCodeValues } from "@/types/api";
import type { Recipe } from "@/types/inventory";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface RecipeDialogProps {
  mutate: () => void;
  organizationSlug?: string;
  recipe: Recipe | null;
}

const RecipeDialog = ({
  mutate,
  organizationSlug,
  recipe,
}: RecipeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const unbound = !recipe?.menuItemId;

  const recipeFormSchema = useRecipeFormSchema(unbound);
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<RecipeForm>({
    defaultValues: {
      name: recipe?.name || {},
      recipeYield: String(recipe?.recipeYield ?? 1),
      recipeYieldQuantity: recipe?.recipeYieldQuantity || "",
      recipeYieldUnitCode: recipe?.recipeYieldUnitCode || "",
    },
    resolver: zodResolver(recipeFormSchema),
  });

  const name = useWatch({ control, name: "name" });
  const recipeYield = useWatch({ control, name: "recipeYield" });
  const recipeYieldQuantity = useWatch({
    control,
    name: "recipeYieldQuantity",
  });
  const recipeYieldUnitCode = useWatch({
    control,
    name: "recipeYieldUnitCode",
  });

  const action = !recipe
    ? "createRecipe"
    : unbound
      ? "editRecipe"
      : "updateRecipe";

  const onSubmitHandler = async (values: RecipeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Recipe>(
        recipe
          ? `/api/recipes/${recipe.id}`
          : `/api/organizations/${organizationSlug}/recipes`,
        {
          method: recipe ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeYield: Number(values.recipeYield),
            ...(unbound && {
              menuItemId: null,
              name: values.name,
              recipeYieldQuantity: values.recipeYieldQuantity || null,
              recipeYieldUnitCode: values.recipeYieldUnitCode || null,
            }),
          }),
        },
      );

      enqueueSnackbar(tInventory(`recipes.actions.${action}.success`), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="recipe-form" onSubmit={onSubmit}>
      {unbound && (
        <LocalizedTextFields
          fields={(lang) => [
            {
              error: !!errors.name?.[lang],
              fullWidth: true,
              helperText: errors.name?.[lang]?.message,
              label: tInventory("recipes.name.label"),
              onChange: (event) =>
                setValue("name", { ...name, [lang]: event.target.value }),
              placeholder: tInventory("recipes.name.placeholder"),
              required: true,
              value: name?.[lang] || "",
            },
          ]}
        />
      )}
      <NumberSpinner
        error={!!errors.recipeYield}
        fullWidth
        helperText={errors.recipeYield?.message}
        label={tInventory("recipes.recipeYield.label")}
        max={9999}
        min={1}
        onValueChange={(value) =>
          setValue("recipeYield", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("recipes.recipeYield.placeholder")}
        required
        value={recipeYield ? Number(recipeYield) : null}
      />
      {unbound && (
        <>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={3}
            error={!!errors.recipeYieldQuantity}
            fullWidth
            helperText={
              errors.recipeYieldQuantity?.message ||
              tInventory("recipes.recipeYieldQuantity.helperText")
            }
            isAllowed={({ floatValue }) =>
              floatValue === undefined || floatValue <= 999999999.999
            }
            label={`${tInventory("recipes.recipeYieldQuantity.label")} ${tCommon("optional")}`}
            onValueChange={({ value }) =>
              setValue("recipeYieldQuantity", value, {
                shouldValidate: isSubmitted,
              })
            }
            placeholder={tInventory("recipes.recipeYieldQuantity.placeholder")}
            thousandSeparator=","
            value={recipeYieldQuantity}
            valueIsNumericString
          />
          <TextField
            error={!!errors.recipeYieldUnitCode}
            fullWidth
            helperText={errors.recipeYieldUnitCode?.message}
            label={`${tInventory("recipes.recipeYieldUnitCode.label")} ${tCommon("optional")}`}
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
                      {tInventory("recipes.recipeYieldUnitCode.placeholder")}
                    </em>
                  );
                },
              },
            }}
            value={recipeYieldUnitCode}
            {...register("recipeYieldUnitCode")}
          >
            <MenuItem value="">
              <em>{tInventory("recipes.recipeYieldUnitCode.placeholder")}</em>
            </MenuItem>
            {unitCodeValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tInventory(`units.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </>
      )}
    </FormBox>
  );
};

export default RecipeDialog;
