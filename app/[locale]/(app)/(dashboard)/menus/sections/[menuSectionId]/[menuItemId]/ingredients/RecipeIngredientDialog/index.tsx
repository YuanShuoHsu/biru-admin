"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  useRecipeIngredientFormSchema,
  type RecipeIngredientForm,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { useServerSearchOptions } from "@/hooks/useServerSearchOptions";

import { Autocomplete, CircularProgress, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient, Recipe, RecipeIngredient } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

type IngredientOption = Pick<Ingredient, "id" | "name" | "unitCode">;

interface RecipeIngredientDialogProps {
  material: RecipeIngredient | null;
  materials: RecipeIngredient[];
  mutate: () => void;
  organizationSlug: string;
  recipe: Recipe;
}

const RecipeIngredientDialog = ({
  material,
  materials,
  mutate,
  organizationSlug,
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
    setValue,
  } = useForm<RecipeIngredientForm>({
    defaultValues: {
      ingredientId: material?.ingredientId || "",
      requiredQuantity: material?.requiredQuantity || "",
    },
    resolver: zodResolver(recipeIngredientFormSchema),
  });

  const requiredQuantity = useWatch({ control, name: "requiredQuantity" });

  const action = material ? "updateRecipeIngredient" : "createRecipeIngredient";
  // 同一個食材在一份食譜裡只能有一列，否則兩列的用量會各自扣一次庫存
  const usedIngredientIds = new Set(
    materials.flatMap(({ id, ingredientId }) =>
      id === material?.id ? [] : ingredientId,
    ),
  );

  const [ingredient, setIngredient] = useState<IngredientOption | null>(
    material
      ? {
          id: material.ingredientId,
          name: material.ingredientName,
          unitCode: material.unitCode,
        }
      : null,
  );
  const ingredientSearch = useServerSearchOptions(
    `/api/organizations/${organizationSlug}/ingredients`,
    ingredient ? [ingredient] : [],
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
      <Autocomplete
        {...ingredientSearch}
        fullWidth
        getOptionDisabled={({ id }) => usedIngredientIds.has(id)}
        getOptionLabel={({ name }) => localize(name, locale)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, value) => {
          setIngredient(value);
          setValue("ingredientId", value?.id ?? "", {
            shouldValidate: isSubmitted,
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            error={!!errors.ingredientId}
            helperText={errors.ingredientId?.message}
            label={tInventory("recipes.ingredients.ingredientId.label")}
            placeholder={tInventory(
              "recipes.ingredients.ingredientId.placeholder",
            )}
            required
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {ingredientSearch.loading && (
                      <CircularProgress color="inherit" size={20} />
                    )}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
        value={ingredient}
      />
      <NumberSpinner
        error={!!errors.requiredQuantity}
        fullWidth
        helperText={
          errors.requiredQuantity?.message ||
          (ingredient?.unitCode && tInventory(`units.${ingredient.unitCode}`))
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
