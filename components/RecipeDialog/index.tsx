"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRecipeFormSchema, type RecipeForm } from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Recipe } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";

interface RecipeDialogProps {
  defaultName: Recipe["name"] | null;
  menuItemId: string;
  mutate: () => void;
  organizationSlug: string;
  recipe: Pick<Recipe, "id" | "name" | "recipeYield"> | null;
}

const RecipeDialog = ({
  defaultName,
  menuItemId,
  mutate,
  organizationSlug,
  recipe,
}: RecipeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tInventory = useTranslations("inventory");

  const recipeFormSchema = useRecipeFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<RecipeForm>({
    defaultValues: {
      name: recipe?.name || defaultName || {},
      recipeYield: String(recipe?.recipeYield || 1),
    },
    resolver: zodResolver(recipeFormSchema),
  });

  const name = useWatch({ control, name: "name" });
  const recipeYield = useWatch({ control, name: "recipeYield" });

  const action = recipe ? "updateRecipe" : "createRecipe";

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
            ...(recipe ? {} : { menuItemId }),
            name: values.name,
            recipeYield: Number(values.recipeYield),
          }),
        },
      );

      enqueueSnackbar(tInventory(`recipes.actions.${action}.success`), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tInventory(`recipes.actions.${action}.error`), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="recipe-form" onSubmit={onSubmit}>
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
