"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useRecipeFormSchema, type RecipeForm } from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem as MuiMenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Recipe } from "@/types/inventory";
import type { MenuItem } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface RecipeDialogProps {
  defaultMenuItemId: string | null;
  defaultName: Recipe["name"] | null;
  menuItems: MenuItem[];
  mutate: () => void;
  organizationSlug: string;
  recipe: Pick<Recipe, "id" | "menuItemId" | "name" | "recipeYield"> | null;
}

const RecipeDialog = ({
  defaultMenuItemId,
  defaultName,
  menuItems,
  mutate,
  organizationSlug,
  recipe,
}: RecipeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const recipeFormSchema = useRecipeFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<RecipeForm>({
    defaultValues: {
      menuItemId: recipe?.menuItemId || defaultMenuItemId || "",
      name: recipe?.name || defaultName || {},
      recipeYield: String(recipe?.recipeYield || 1),
    },
    resolver: zodResolver(recipeFormSchema),
  });

  const menuItemId = useWatch({ control, name: "menuItemId" });
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
            menuItemId: values.menuItemId || null,
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
      <TextField
        error={!!errors.menuItemId}
        fullWidth
        helperText={
          errors.menuItemId?.message ||
          tInventory("recipes.menuItemId.helperText")
        }
        label={`${tInventory("recipes.menuItemId.label")} ${tCommon("optional")}`}
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const menuItem = menuItems.find(({ id }) => id === selected);

              return menuItem ? (
                localize(menuItem.name, locale)
              ) : (
                <em>{tInventory("recipes.menuItemId.placeholder")}</em>
              );
            },
          },
        }}
        value={menuItemId}
        {...register("menuItemId")}
      >
        <MuiMenuItem value="">
          <em>{tInventory("recipes.menuItemId.placeholder")}</em>
        </MuiMenuItem>
        {menuItems.map(({ id, name: menuItemName }) => (
          <MuiMenuItem key={id} value={id}>
            {localize(menuItemName, locale)}
          </MuiMenuItem>
        ))}
      </TextField>
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
