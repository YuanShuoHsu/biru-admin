"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRecipeFormSchema, type RecipeForm } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Recipe } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";

interface RecipeDialogProps {
  mutate: () => void;
  recipe: Pick<Recipe, "id" | "recipeYield">;
}

const RecipeDialog = ({ mutate, recipe }: RecipeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tInventory = useTranslations("inventory");

  const recipeFormSchema = useRecipeFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<RecipeForm>({
    defaultValues: { recipeYield: String(recipe.recipeYield) },
    resolver: zodResolver(recipeFormSchema),
  });

  const recipeYield = useWatch({ control, name: "recipeYield" });

  const onSubmitHandler = async (values: RecipeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Recipe>(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeYield: Number(values.recipeYield) }),
      });

      enqueueSnackbar(tInventory("recipes.actions.updateRecipe.success"), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tInventory("recipes.actions.updateRecipe.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="recipe-form" onSubmit={onSubmit}>
      <NumberSpinner
        error={!!errors.recipeYield}
        fullWidth
        helperText={errors.recipeYield?.message}
        label={tInventory("recipes.recipeYield.label")}
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
    </FormBox>
  );
};

export default RecipeDialog;
