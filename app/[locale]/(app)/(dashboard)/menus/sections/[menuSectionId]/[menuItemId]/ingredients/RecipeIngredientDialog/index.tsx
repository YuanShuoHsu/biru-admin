"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  useRecipeIngredientFormSchema,
  type RecipeIngredientForm,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient, Recipe, RecipeIngredient } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface RecipeIngredientDialogProps {
  ingredients: Ingredient[];
  material: RecipeIngredient | null;
  materials: RecipeIngredient[];
  mutate: () => void;
  recipe: Recipe;
}

const RecipeIngredientDialog = ({
  ingredients,
  material,
  materials,
  mutate,
  recipe,
}: RecipeIngredientDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tInventory = useTranslations("inventory");

  const recipeIngredientFormSchema = useRecipeIngredientFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<RecipeIngredientForm>({
    defaultValues: {
      ingredientId: material?.ingredientId || "",
      requiredQuantity: material?.requiredQuantity || "",
    },
    resolver: zodResolver(recipeIngredientFormSchema),
  });

  const ingredientId = useWatch({ control, name: "ingredientId" });
  const requiredQuantity = useWatch({ control, name: "requiredQuantity" });

  const action = material ? "updateRecipeIngredient" : "createRecipeIngredient";
  const unitCode = ingredients.find(({ id }) => id === ingredientId)?.unitCode;
  // 同一個食材在一份食譜裡只能有一列，否則兩列的用量會各自扣一次庫存
  const usedIngredientIds = new Set(
    materials.flatMap(({ id, ingredientId }) =>
      id === material?.id ? [] : ingredientId,
    ),
  );

  const onSubmitHandler = async (values: RecipeIngredientForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<RecipeIngredient>(
        material
          ? `/api/recipes/${recipe.id}/recipe-ingredients/${material.id}`
          : `/api/recipes/${recipe.id}/recipe-ingredients`,
        {
          method: material ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      enqueueSnackbar(
        tInventory(`recipes.ingredients.actions.${action}.success`),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(
        tInventory(`recipes.ingredients.actions.${action}.error`),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="recipe-ingredient-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.ingredientId}
        fullWidth
        helperText={errors.ingredientId?.message}
        label={tInventory("recipes.ingredients.ingredientId.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const ingredient = ingredients.find(({ id }) => id === selected);

              return ingredient ? (
                localize(ingredient.name, locale)
              ) : (
                <em>
                  {tInventory("recipes.ingredients.ingredientId.placeholder")}
                </em>
              );
            },
          },
        }}
        value={ingredientId}
        {...register("ingredientId")}
      >
        <MenuItem disabled value="">
          <em>{tInventory("recipes.ingredients.ingredientId.placeholder")}</em>
        </MenuItem>
        {ingredients.map(({ id, name }) => (
          <MenuItem disabled={usedIngredientIds.has(id)} key={id} value={id}>
            {localize(name, locale)}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        error={!!errors.requiredQuantity}
        fullWidth
        helperText={
          errors.requiredQuantity?.message ||
          (unitCode && tInventory(`units.${unitCode}`))
        }
        label={tInventory("recipes.ingredients.requiredQuantity.label")}
        min={0}
        onValueChange={(value) =>
          setValue("requiredQuantity", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory(
          "recipes.ingredients.requiredQuantity.placeholder",
        )}
        required
        value={requiredQuantity ? Number(requiredQuantity) : null}
      />
    </FormBox>
  );
};

export default RecipeIngredientDialog;
